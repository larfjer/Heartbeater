import { useState, useRef, useEffect } from "react";

interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selected: Set<string>;
  onChange: (selected: Set<string>) => void;
  placeholder?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  className?: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Select options",
  error,
  helperText,
  fullWidth = false,
  className = "",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    onChange(newSelected);
  };

  const getDisplayText = () => {
    if (selected.size === 0) {
      return placeholder;
    }
    if (selected.size === 1) {
      const selectedOption = options.find((opt) => selected.has(opt.value));
      return selectedOption?.label || placeholder;
    }
    return `${selected.size} selected`;
  };

  return (
    <div
      className={`form-group ${fullWidth ? "form-group-flex" : ""} ${className}`}
    >
      {label && <label className="form-label">{label}</label>}
      <div className="form-field-wrapper">
        <div ref={containerRef} className="multi-select">
          <button
            type="button"
            className={`multi-select-trigger ${error ? "multi-select-error" : ""}`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <span className="multi-select-text">{getDisplayText()}</span>
            <span className="material-icons multi-select-icon">
              {isOpen ? "expand_less" : "expand_more"}
            </span>
          </button>

          {isOpen && (
            <div className="multi-select-dropdown">
              {options.length === 0 ? (
                <div className="multi-select-empty">No options available</div>
              ) : (
                options.map((option) => (
                  <label
                    key={option.value}
                    className="multi-select-option"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(option.value)}
                      onChange={() => toggleOption(option.value)}
                    />
                    <span className="multi-select-option-label">
                      {option.label}
                    </span>
                    {selected.has(option.value) && (
                      <span className="material-icons multi-select-check">
                        check
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          )}
        </div>
        {error && <span className="form-error">{error}</span>}
        {helperText && !error && (
          <span className="form-helper">{helperText}</span>
        )}
      </div>
    </div>
  );
}
