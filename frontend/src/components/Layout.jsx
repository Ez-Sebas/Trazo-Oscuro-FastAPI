import { Outlet } from 'react-router-dom'
import { Header } from './Header.jsx'
import { Footer } from './Footer.jsx'
import { WhatsAppButton } from './WhatsAppButton.jsx'

export const Layout = () => {
    return (
        <>
            <Header />
            <Outlet />
            <Footer />
            <WhatsAppButton />
        </>
    )
}