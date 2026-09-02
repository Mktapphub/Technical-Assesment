import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Student Management System - Registry Module',
  description:
    'Registry management system for student enrolment, fees and payments, assessment submission, and grade marksheet.',
  openGraph: {
    title: 'Student Management System - Registry Module',
    description:
      'Registry management system for student enrolment, fees and payments, assessment submission, and grade marksheet.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Student Management System - Registry Module',
    description:
      'Registry management system for student enrolment, fees and payments, assessment submission, and grade marksheet.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Lora:ital,wght@0,500;0,600;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
