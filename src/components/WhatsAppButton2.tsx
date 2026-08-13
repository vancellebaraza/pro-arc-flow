import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  const phoneNumber = "254106910483"; 

  const message = encodeURIComponent(
    "Hello, I would like to make an inquiry about your services."
  );

  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="
        fixed bottom-6 right-6 z-50
        flex h-14 w-14 items-center justify-center
        rounded-full
        bg-green-500
        text-white
        shadow-lg
        transition-all duration-300
        hover:scale-110
        hover:bg-green-600
        hover:shadow-xl
      "
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}