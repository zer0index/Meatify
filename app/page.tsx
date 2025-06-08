import { redirect } from 'next/navigation';

export default function Home() {
  // Automatically redirect to the grill page
  redirect('/grill');
}
