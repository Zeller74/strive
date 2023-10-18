import Image from 'next/image'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function Home() {
  return (
    <main>
      <div className="NavBar">
        <ul>
          <li><a href="https://localhost:3000" target="_blank" rel="noopener noreferrer">Home</a></li>
          <li><a href="https://localHost:3000" target="_blank" rel="noopener noreferrer">Sign in</a></li>
        </ul>
      </div>

      <div>

      </div>

      <div className="SignIn">
        <ul>
          <li><a href="https://localhost:3000" target="_blank" rel="noopener noreferrer">
              <h2>Sign up{' '}</h2><p>Join your fellow classmates now!</p>
            </a>
          </li>
        </ul>
        
      </div>
    </main>
  )
}
