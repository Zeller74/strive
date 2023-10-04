import "../styles/globals.css";
import { ClerkProvider } from "@clerk/nextjs";

function ClerkSupabaseApp({ Component, pageProps }) {
  return (
    <ClerkProvider>
      <Component {...pageProps} />
    </ClerkProvider>
  );
}

export default ClerkSupabaseApp;