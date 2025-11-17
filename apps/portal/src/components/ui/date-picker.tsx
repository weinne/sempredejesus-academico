import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { formatDateToBR, parseDateFromBR, parseISODate } from "@/lib/date-utils"

export interface DatePickerProps {
  value?: string | null
  onChange?: (value: string | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  id?: string
  name?: string
}

/**
 * Componente DatePicker com formato brasileiro (dd/mm/yyyy)
 * Aceita e retorna valores no formato ISO (yyyy-mm-dd) para compatibilidade com backend
 * Mas exibe e permite entrada no formato brasileiro
 */
export function DatePicker({
  value,
  onChange,
  placeholder = "dd/mm/aaaa",
  disabled = false,
  className,
  id,
  name,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  // Converte valor ISO para Date object para o calendário
  const selectedDate = React.useMemo(() => {
    if (!value) return undefined
    return parseISODate(value)
  }, [value])
  
  // Formata valor para exibição no input (formato brasileiro)
  const displayValue = React.useMemo(() => {
    if (!value) return ""
    return formatDateToBR(value)
  }, [value])
  
  // Estado interno para input de texto (formato brasileiro)
  const [inputValue, setInputValue] = React.useState(displayValue)
  
  // Sincroniza inputValue quando value muda externamente
  React.useEffect(() => {
    setInputValue(displayValue)
  }, [displayValue])
  
  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange?.(null)
      setInputValue("")
      setOpen(false)
      return
    }
    
    // Converte Date para ISO (yyyy-mm-dd)
    const isoDate = format(date, "yyyy-MM-dd")
    onChange?.(isoDate)
    setInputValue(formatDateToBR(isoDate))
    setOpen(false)
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    
    // Remove caracteres não numéricos exceto barras
    newValue = newValue.replace(/[^\d/]/g, "")
    
    // Aplica máscara automática dd/mm/yyyy
    if (newValue.length <= 10) {
      // Remove barras existentes para recalcular
      const digits = newValue.replace(/\//g, "")
      
      let masked = ""
      for (let i = 0; i < digits.length; i++) {
        if (i === 2 || i === 4) {
          masked += "/"
        }
        masked += digits[i]
      }
      
      newValue = masked
    } else {
      // Limita a 10 caracteres (dd/mm/yyyy)
      newValue = newValue.slice(0, 10)
    }
    
    setInputValue(newValue)
    
    // Se o usuário digitou uma data válida no formato brasileiro, converte para ISO
    if (newValue.trim() && newValue.length === 10) {
      const isoDate = parseDateFromBR(newValue)
      if (isoDate) {
        onChange?.(isoDate)
      }
    } else if (!newValue.trim()) {
      // Campo vazio
      onChange?.(null)
    }
  }
  
  const handleInputBlur = () => {
    // Ao perder o foco, valida e corrige o formato se necessário
    if (inputValue.trim()) {
      const isoDate = parseDateFromBR(inputValue)
      if (isoDate) {
        // Formato válido, atualiza display formatado
        setInputValue(formatDateToBR(isoDate))
      } else {
        // Formato inválido, restaura valor anterior ou limpa
        setInputValue(displayValue)
      }
    }
  }
  
  return (
    <div className={cn("relative flex w-full", className)}>
      <Input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        className="pr-10"
        id={id}
        name={name}
        inputMode="numeric"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-0 h-10 w-10 rounded-l-none",
              disabled && "cursor-not-allowed opacity-50"
            )}
            disabled={disabled}
            onClick={(e) => {
              e.preventDefault()
              setOpen(!open)
            }}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="sr-only">Abrir calendário</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker
            mode="single"
            selected={selectedDate || undefined}
            onSelect={handleDateSelect}
            locale={ptBR}
            initialFocus
            className="p-3"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              ),
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}

/**
 * Wrapper do DatePicker para uso com react-hook-form
 */
export interface DatePickerFieldProps extends Omit<DatePickerProps, 'value' | 'onChange'> {
  value?: string | null
  onChange?: (value: string | null) => void
}

export const DatePickerField = React.forwardRef<HTMLButtonElement, DatePickerFieldProps>(
  ({ value, onChange, ...props }, ref) => {
    return (
      <DatePicker
        value={value}
        onChange={onChange}
        {...props}
      />
    )
  }
)
DatePickerField.displayName = "DatePickerField"

