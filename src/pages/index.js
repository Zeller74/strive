import styles from "../styles/Home.module.css";

import { useAuth, useUser, UserButton, SignInButton, SignUpButton } from "@clerk/nextjs";

export default function Home() {
  const { isSignedIn, isLoading, user } = useUser();
  return (
    <>
      <Header />
      {isLoading ? (
        <></>
      ) : (
        <main className={styles.main}>
          <div className={styles.container}>
            {isSignedIn ? (
              <>
                <div className={styles.label}>Welcome {user.firstName}!</div>
              </>
            ) : (
              <div className={styles.label}>
                strive
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}

const Header = () => {
  const { isSignedIn } = useUser();

  return (
    <header className={styles.header}>
      <div>Strive</div>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <div>
          <SignInButton />
          &nbsp;
          <SignUpButton />
        </div>
      )}
    </header>
  );
};