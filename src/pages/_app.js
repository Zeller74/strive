import "../styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import "react-pro-sidebar/dist/css/styles.css";
import "../styles/Header.css"

function ClerkSupabaseApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default ClerkSupabaseApp;