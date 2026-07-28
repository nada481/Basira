import "./globals.css";
import Nav from "@/components/main/Nav";
import Hero from "@/components/main/Hero";
import Footer from "@/components/main/Footer";


export const metadata = {
  title: "Basira",
};
 
export default function Page() {
  return (
    <>
      <Nav />
      <Hero />
      <Footer />
    </>
  );
}
 