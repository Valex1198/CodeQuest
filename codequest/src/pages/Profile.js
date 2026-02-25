import { useAuth } from "../AuthContext";
import { useState } from "react";
import { User, Lock } from "lucide-react"; // <-- imported icons

export default function Profile() {
  const { user, setUser } = useAuth();
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || "");
  const [showAccountOptions, setShowAccountOptions] = useState(false);
  const [showStats, setShowStats] = useState(false);

  const avatars = [
    "/avatars/avatar1.png",
    "/avatars/avatar2.png",
    "/avatars/avatar3.png",
    "/avatars/avatar4.png",
    "/avatars/avatar5.png",
    "/avatars/avatar6.png",
    "/avatars/avatar7.png",
    "/avatars/avatar8.gif",
    "/avatars/avatar9.gif",
   
  ];

  const handleSave = () => {
    if (!user) return;

    const updatedUser = { ...user, avatar: selectedAvatar };
    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setShowAvatarPicker(false);

    alert("✅ Profile updated!");
  };

  const formattedDate = user?.date_created
    ? new Date(user.date_created).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-6">My Profile</h1>

        {/* Avatar with hover edit */}
        <div className="relative group w-28 h-28 mx-auto mb-4">
          <img
            src={user?.avatar || "/avatars/avatar1.png"}
            alt="Avatar"
            className="w-28 h-28 rounded-full border-4 border-blue-500 object-cover"
          />
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 text-white font-semibold opacity-0 group-hover:opacity-100 transition rounded-full"
          >
            Edit
          </button>
        </div>

        {/* Basic Info */}
        <p className="text-lg font-semibold">{user?.username}</p>
        <p className="text-sm text-gray-400">{user?.email}</p>
        <p className="text-sm text-gray-400 mb-4">{user?.role}</p>

        {/* Stats Button */}
        <button
          onClick={() => setShowStats(!showStats)}
          className="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg font-bold transition mb-3"
        >
          View Stats
        </button>

        {showStats && (
          <div className="bg-gray-700 p-4 rounded-lg mb-6 text-sm text-gray-300 text-left">
            <p className="mb-2">
              <span className="font-semibold text-white">Account Created:</span>{" "}
              {formattedDate}
            </p>
          </div>
        )}

        {/* Manage Account Button */}
        <button
          onClick={() => setShowAccountOptions(!showAccountOptions)}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-bold transition"
        >
          Manage Account
        </button>

        {/* Account Options */}
        {showAccountOptions && (
          <div className="mt-4 space-y-3">
            <button
              onClick={() => alert("✏️ Feature coming soon: Change Username")}
              className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition"
            >
              <User size={18} /> Change Username
            </button>
            <button
              onClick={() => alert("⚙️ Feature coming soon: Change Password")}
              className="w-full flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 py-2 rounded-lg transition"
            >
              <Lock size={18} /> Change Password
            </button>
          </div>
        )}
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center">Choose an Avatar</h2>

            <div className="grid grid-cols-3 gap-4 mb-6">
              {avatars.map((avatar, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`cursor-pointer p-2 rounded-lg border-4 transition ${
                    selectedAvatar === avatar
                      ? "border-green-500 bg-gray-700"
                      : "border-transparent bg-gray-700 hover:bg-gray-600"
                  }`}
                >
                  <img
                    src={avatar}
                    alt={`Avatar ${index + 1}`}
                    className="w-20 h-20 mx-auto rounded-md object-cover"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setSelectedAvatar(user?.avatar || "");
                  setShowAvatarPicker(false);
                }}
                className="flex-1 bg-gray-600 hover:bg-gray-700 p-2 rounded font-bold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
