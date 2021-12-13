import Head from "next/head";
import Link from "next/link";

export default function Layout({ children }) {
  return (
    <div>
      <Head>
        <title>Face Landmarks Filters</title>
        <meta name="description" content="Face Landmarks Filters" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <nav>
        <Link href="/">
          <a>Home</a>
        </Link>
        <Link href="/images">
          <a>Images</a>
        </Link>
      </nav>

      <main>{children}</main>
      <style jsx>{`
        nav {
          height: 100px;
          background-color: var(--color-primary);
          display: flex;
          flex-flow: row wrap;
          justify-content: center;
          align-items: center;
          gap: 10px;
        }

        nav a {
          font-weight: bold;
          letter-spacing: 1px;
        }

        main {
          min-height: calc(100vh- 100px);
          background-color: #f4f4f4;
        }
      `}</style>
    </div>
  );
}
