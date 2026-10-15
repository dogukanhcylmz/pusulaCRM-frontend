import { forwardRef, type ButtonHTMLAttributes } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { tr } from "date-fns/locale/tr";
import { CalendarDays } from "lucide-react";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("tr", tr);

interface Props {
  value: Date | null;
  onChange: (value: Date | null) => void;
  withTime?: boolean;
  minDate?: Date;
}

export default function DateField({ value, onChange, withTime, minDate }: Props) {
  const mobile = window.matchMedia("(max-width: 760px)").matches;

  return (
    <DatePicker
      selected={value}
      onChange={onChange}
      locale="tr"
      dateFormat={withTime ? "dd.MM.yyyy HH:mm" : "dd.MM.yyyy"}
      showTimeSelect={withTime}
      timeIntervals={15}
      timeCaption="Saat"
      minDate={minDate}
      placeholderText={withTime ? "Tarih ve saat seçin" : "Tarih seçin"}
      isClearable
      showIcon
      icon={<CalendarDays size={16} />}
      wrapperClassName="date-field"
      calendarClassName="date-calendar"
      // Takvim body'ye çizilir: modalda kırpılmaz, label içindeki tıklamalar onu yeniden açmaz
      portalId="date-picker-root"
      withPortal={mobile}
      // Telefonda klavye açılmasın diye yazı kutusu yerine düğme
      customInput={mobile ? <TapInput /> : undefined}
    />
  );
}

type TapInputProps = ButtonHTMLAttributes<HTMLButtonElement> & { value?: string; placeholder?: string };

const TapInput = forwardRef<HTMLButtonElement, TapInputProps>(({ value, placeholder, onClick }, ref) => (
  <button type="button" ref={ref} onClick={onClick} className={value ? "date-tap" : "date-tap empty"}>
    {value || placeholder}
  </button>
));
