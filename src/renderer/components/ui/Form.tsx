import type {
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  SelectHTMLAttributes,
  ReactNode,
} from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  className = "",
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div
      className={`form-group ${fullWidth ? "form-group-flex" : ""} ${className}`}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={`form-label ${fullWidth ? "form-label-flex" : ""}`}
        >
          {label}
        </label>
      )}
      <div className="form-field-wrapper">
        <input
          id={inputId}
          className={`form-input ${fullWidth ? "form-input-flex" : ""} ${error ? "form-input-error" : ""}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
        {helperText && !error && (
          <span className="form-helper">{helperText}</span>
        )}
      </div>
    </div>
  );
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

export function TextArea({
  label,
  error,
  helperText,
  fullWidth = false,
  className = "",
  id,
  ...props
}: TextAreaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div
      className={`form-group ${fullWidth ? "form-group-flex" : ""} ${className}`}
    >
      {label && (
        <label
          htmlFor={inputId}
          className={`form-label ${fullWidth ? "form-label-flex" : ""}`}
        >
          {label}
        </label>
      )}
      <div className="form-field-wrapper">
        <textarea
          id={inputId}
          className={`form-input form-textarea ${fullWidth ? "form-input-flex" : ""} ${error ? "form-input-error" : ""}`}
          {...props}
        />
        {error && <span className="form-error">{error}</span>}
        {helperText && !error && (
          <span className="form-helper">{helperText}</span>
        )}
      </div>
    </div>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({
  label,
  error,
  helperText,
  fullWidth = false,
  options,
  placeholder,
  className = "",
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div
      className={`form-group ${fullWidth ? "form-group-flex" : ""} ${className}`}
    >
      {label && (
        <label
          htmlFor={selectId}
          className={`form-label ${fullWidth ? "form-label-flex" : ""}`}
        >
          {label}
        </label>
      )}
      <div className="form-field-wrapper">
        <select
          id={selectId}
          className={`form-input form-select ${fullWidth ? "form-input-flex" : ""} ${error ? "form-input-error" : ""}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="form-error">{error}</span>}
        {helperText && !error && (
          <span className="form-helper">{helperText}</span>
        )}
      </div>
    </div>
  );
}

interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label: string;
}

export function Checkbox({
  label,
  className = "",
  id,
  ...props
}: CheckboxProps) {
  const checkboxId = id || label.toLowerCase().replace(/\s+/g, "-");

  return (
    <label htmlFor={checkboxId} className={`form-checkbox ${className}`}>
      <input type="checkbox" id={checkboxId} {...props} />
      <span className="form-checkbox-label">{label}</span>
    </label>
  );
}

interface FormGroupProps {
  children: ReactNode;
  className?: string;
  direction?: "row" | "column";
}

export function FormGroup({
  children,
  className = "",
  direction = "column",
}: FormGroupProps) {
  const directionClass = direction === "row" ? "form-group-row" : "";
  return (
    <div className={`form-group ${directionClass} ${className}`}>
      {children}
    </div>
  );
}
