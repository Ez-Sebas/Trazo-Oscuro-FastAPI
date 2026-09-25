import { Outlet } from 'react-router-dom'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'
import { WhatsAppButton } from './WhatsAppButton.jsx'
import { ChatWidget } from './ChatWidget.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export const Layout = () => {
    const { usuario } = useAuth()
    return (
        <>
            <Header />
            <Outlet />
            <Footer />
            <WhatsAppButton />
            <ChatWidget key={usuario?.id ?? 'sin-sesion'} />
        </>
    )
}
