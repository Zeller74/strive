import styles from "../styles/Home.module.css";
import { useState, useEffect } from "react";

import {
  useAuth,
  useUser,
  UserButton,
  SignInButton,
  SignUpButton,
  useSession,
} from "@clerk/nextjs";

import { createClient } from "@supabase/supabase-js";

const supabaseClient = async (supabaseAccessToken) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      global: { headers: { Authorization: `Bearer ${supabaseAccessToken}` } },
    }
  );

  return supabase;
};

const ChatMessages = ({ messages, setMessages }) => {
  return (
    <>
      {messages?.filter(Boolean).map((message) => (
        <div key={message.id}>
          <strong>{message.user?.name ?? "Unknown User"}</strong>:{" "}
          {message?.text ?? "Message not available"}
        </div>
      ))}
    </>
  );
};

function SendMessageForm({ messages, setMessages, refreshMessages }) {
  const { getToken, userId } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const { session } = useSession();
  const [studyGroup, setStudyGroup] = useState(null);

  useEffect(() => {
    const fetchStudyGroup = async () => {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);

      const { data: userData } = await supabase
        .from("user")
        .select("study_group")
        .eq("user_id", userId);
      setStudyGroup(userData[0]?.study_group);
    };

    fetchStudyGroup();
  }, [userId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newMessage === "") {
      return;
    }

    const supabaseAccessToken = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(supabaseAccessToken);

    const { data } = await supabase
      .from("message")
      .insert({
        text: newMessage,
        user_id: userId,
        study_group: studyGroup ?? 0,
      })
      .single();

    setMessages([...messages, data]);
    setNewMessage("");

    refreshMessages();
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        onChange={(e) => setNewMessage(e.target.value)}
        value={newMessage}
      />
      <button>Send</button>
    </form>
  );
}

export default function Home() {
  const { isSignedIn, isLoading, user } = useUser();
  const [messages, setMessages] = useState([]);
  const { getToken, userId } = useAuth();
  const [selectedStudyGroup, setSelectedStudyGroup] = useState(0); // State for the selected group

  async function fetchMessagesForGroup() {
    const supabaseAccessToken = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(supabaseAccessToken);

    // Fetch messages for the group
    const { data: groupMessages, error: error1 } = await supabase
      .from("message")
      .select("*")
      .match({ study_group: selectedStudyGroup })
      .order("id", { ascending: false });

    if (error1) {
      console.error("Error fetching group messages:", error1);
      return;
    }

    // Fetch all users
    const { data: users, error: error2 } = await supabase
      .from("user")
      .select("*");

    if (error2) {
      console.error("Error fetching users:", error2);
      return;
    }

    // Manually join the messages with users
    const joinedMessages = groupMessages.map((message) => {
      const userForMessage = users.find(
        (user) => user.user_id === message.user_id
      );
      return {
        ...message,
        user: userForMessage,
      };
    });

    setMessages(joinedMessages);
  }

  useEffect(() => {
    // Function to ensure user exists in Supabase
    async function ensureUserInSupabase() {
      if (isLoading || !isSignedIn || !user) return; // Exit early if loading, not signed in, or no user

      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);

      const { data: usersData, error } = await supabase
        .from("user")
        .select("study_group")
        .eq("user_id", userId); // Using "user.id" directly

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (!usersData || usersData.length === 0) {
        // User does not exist, create a new record
        await supabase
          .from("user")
          .insert({ user_id: userId, study_group: 0, name: user.firstName });
      }
    }

    ensureUserInSupabase();
  }, [isLoading, isSignedIn, user, getToken]); // Added dependencies here

  useEffect(() => {

    fetchMessagesForGroup();
    // Set up an interval to call it every 5 seconds
    const interval = setInterval(fetchMessagesForGroup, 5000);

    // Clear the interval when the component is unmounted
    return () => clearInterval(interval);
  }, [selectedStudyGroup]);

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
                <SendMessageForm
                  messages={messages}
                  setMessages={setMessages}
                  refreshMessages={fetchMessagesForGroup}
                />
                <ChatMessages messages={messages} setMessages={setMessages} />
              </>
            ) : (
              <div className={styles.label}>strive</div>
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
