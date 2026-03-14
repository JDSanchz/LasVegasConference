import "../src/styles.css";

export const metadata = {
  title: "Las Vegas Executive Conference",
  description: "Invite-only executive conference landing page and lead dashboard.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
