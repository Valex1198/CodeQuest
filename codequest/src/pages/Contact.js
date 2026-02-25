import { useState } from "react";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const [sent, setSent] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Placeholder for future backend integration
    setSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white px-6 py-12 flex justify-center items-center">
      <div className="max-w-3xl w-full">

        {/* Title */}
        <h1 className="text-5xl font-extrabold mb-6 text-center text-cyan-400">
          Contact Us
        </h1>

        <p className="text-center text-gray-300 mb-10">
          Have questions, feedback, or suggestions about CodeQuest?
          We'd love to hear from you!
        </p>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl p-8 shadow-2xl">

          {sent ? (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-green-400 mb-2">
                ✅ Message Sent
              </h2>
              <p className="text-gray-300">
                Thank you for reaching out! We’ll get back to you soon.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-300">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-cyan-400"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-300">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-cyan-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-semibold text-gray-300">
                  Message
                </label>
                <textarea
                  name="message"
                  rows="5"
                  required
                  value={form.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg bg-gray-900 border border-gray-700 focus:outline-none focus:border-cyan-400 resize-none"
                  placeholder="Type your message here..."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 text-lg font-bold rounded-xl 
                           bg-gradient-to-r from-cyan-400 to-blue-500 
                           hover:scale-105 transition-transform duration-300
                           shadow-[0_0_25px_rgba(0,200,255,0.6)]"
              >
                Send Message
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          CodeQuest — Learn by Playing 🎮
        </p>
      </div>
    </div>
  );
}
