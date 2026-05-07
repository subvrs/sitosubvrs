import '../styles/globals.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Navbar />
      <main style={{ paddingTop: '60px', minHeight: '100vh' }}>
        <Component {...pageProps} />
      </main>
      <Footer />
    </>
  );
}
