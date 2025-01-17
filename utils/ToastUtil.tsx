import { toast } from "react-hot-toast"

export function toastError({ title, theme }: { title: string, theme: string }) {

    const bgColor =
        theme === 'light' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)';

    return (
        toast.error(title, {
            style: {
              border: '1px solid #f87171',
              padding: '16px',
              color: '#f87171',
              backgroundColor: bgColor
            },
            iconTheme: {
              primary: '#f87171',
              secondary: '#FFFAEE',
            },
        })
    )
}

export function toastSuccess({ title, theme }: { title: string, theme: string }) {

    const bgColor =
        theme === 'light' ? 'rgba(255, 255, 255)' : 'rgba(0, 0, 0)';


    return (
        toast.success(title, {
            style: {
              border: '1px solid #a3e635',
              padding: '16px',
              color: '#a3e635',
              backgroundColor: bgColor
            },
            iconTheme: {
              primary: '#a3e635',
              secondary: '#FFFAEE',
            },
        })
    )
}