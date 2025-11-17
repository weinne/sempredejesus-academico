import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, type, placeholder, lang, inputMode, onChange, value, defaultValue, ...props },
    ref
  ) => {
    const isDateInput = type === "date"
    const resolvedPlaceholder = isDateInput ? placeholder ?? "dd/mm/aaaa" : placeholder
    const resolvedLang = isDateInput ? lang ?? "pt-BR" : lang
    const resolvedInputMode = isDateInput ? inputMode ?? "numeric" : inputMode

    const [hasDateValue, setHasDateValue] = React.useState(() => {
      if (!isDateInput) {
        return true
      }
      const initial = (value ?? defaultValue) as string | number | undefined
      return Boolean(initial)
    })

    React.useEffect(() => {
      if (!isDateInput) {
        return
      }
      if (value !== undefined) {
        setHasDateValue(Boolean(value))
      }
    }, [isDateInput, value])

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      if (isDateInput) {
        setHasDateValue(event.target.value !== "")
      }
      onChange?.(event)
    }

    return (
      <input
        type={type}
        placeholder={resolvedPlaceholder}
        lang={resolvedLang}
        inputMode={resolvedInputMode}
        data-placeholder={isDateInput ? resolvedPlaceholder : undefined}
        data-date-empty={isDateInput ? String(!hasDateValue) : undefined}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          isDateInput ? "date-input" : "",
          className
        )}
        ref={ref}
        onChange={handleChange}
        value={value}
        defaultValue={defaultValue}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }