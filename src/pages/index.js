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

//import react pro sidebar components
import {
  ProSidebar,
  Menu,
  MenuItem,
  SidebarHeader,
  SidebarContent,
} from "react-pro-sidebar";

//import icons from react icons
import { FaList, FaRegHeart } from "react-icons/fa";
import { FiHome, FiLogOut, FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";
import { RiPencilLine } from "react-icons/ri";
import { BiCog } from "react-icons/bi";


//import sidebar css from react-pro-sidebar module and our custom css 
import "react-pro-sidebar/dist/css/styles.css";

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

function StudyGroups({ selectedStudyGroup, setSelectedStudyGroup }) {
  const { getToken, userId } = useAuth();
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);

  useEffect(() => {
    const fetchGroups = async () => {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);
  
      // Fetch all study groups
      const { data: allGroupsData } = await supabase
        .from("study_group")
        .select("*");
  
      // Fetch only the study groups where the user is enrolled
      const { data: userEnrollments } = await supabase
        .from("enrollment")
        .select("study_group")
        .eq("user_id", userId);
  
      setGroups(allGroupsData);  // This will set the list of ALL study groups
      setUserGroups(userEnrollments.map(e => e.study_group));  // This will set only the ones user is part of
    };
    
    fetchGroups();
  }, [userId]);
  


  const joinGroup = async (groupId) => {
    const supabaseAccessToken = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(supabaseAccessToken);
    await supabase
      .from("enrollment")
      .insert({ user_id: userId, study_group: groupId });
    setUserGroups([...userGroups, groupId]);
  };

  const leaveGroup = async (groupId) => {
    const supabaseAccessToken = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(supabaseAccessToken);
    await supabase
      .from("enrollment")
      .delete()
      .eq("user_id", userId)
      .eq("study_group", groupId);
    setUserGroups(userGroups.filter((g) => g !== groupId));
  };
  const handleClick = (groupId) => {
    setSelectedStudyGroup(groupId);
  };

  //create initial menuCollapse state using useState hook
  const [menuCollapse, setMenuCollapse] = useState(false)

  //create a custom function that will change menucollapse state from false to true and true to false
  const menuIconClick = () => {
  //condition checking to change state from true to false and vice versa
  menuCollapse ? setMenuCollapse(false) : setMenuCollapse(true);
  };
  
  return (
    <div id="header">
    <ProSidebar collapsed={menuCollapse}>
      <SidebarHeader>
      <div className="logotext">
          <p>{menuCollapse ? "Groups" : "Groups"}</p>
        </div>
        <div className="closemenu" onClick={menuIconClick}>
          {menuCollapse ? (
            <FiArrowRightCircle/>
          ) : (
            <FiArrowLeftCircle/>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <Menu iconShape="square">
          {userGroups.map((groupId) => {
              const group = groups.find((g) => g.id === groupId);
              if (!group) return null;
              return (
                <div key={group.id}>
                  <MenuItem
                    icon={<FaRegHeart />}
                    className={
                      selectedStudyGroup === group.id
                        ? styles.selectedStudyGroup
                        : ""
                    }
                    onClick={() => handleClick(group.id)}
                  >
                    {group.name}
                  </MenuItem>
                </div>
              );
            })}
            <ul>
            {groups.map((group) => (
              <li key={group.id}>
                {userGroups.includes(group.id) ? (
                  <MenuItem
                    onClick={() => leaveGroup(group.id)}
                  >
                    Leave {group.name}
                  </MenuItem>
                ) : (
                  <MenuItem
                    onClick={() => joinGroup(group.id)}
                  >
                    Join {group.name}
                  </MenuItem>
                )}
              </li>
            ))}
          </ul>
        </Menu>
      </SidebarContent>
    </ProSidebar>
</div>
  );
}

function SendMessageForm({ messages, setMessages, refreshMessages, selectedStudyGroup }) {
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
        .select("name")
        .eq("user_id", userId);
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
        study_group: selectedStudyGroup ?? 0,
      })
      .single();

    setMessages([...messages, data]);
    setNewMessage("");

    refreshMessages();
  };

return (
  <form className={styles.sendMessageForm} onSubmit={handleSubmit}>
    <input
      className={styles.chatInput}
      onChange={(e) => setNewMessage(e.target.value)}
      value={newMessage}
    />
    <button className={styles.sendButton}>Send</button>
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
        .select("name")
        .eq("user_id", userId); // Using "user.id" directly

      if (error) {
        console.error("Error fetching user data:", error);
        return;
      }

      if (!usersData || usersData.length === 0) {
        // User does not exist, create a new record
        await supabase
          .from("user")
          .insert({ user_id: userId, name: user.firstName });
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
        <main  >
          <div className={styles.container}>
            {isSignedIn ? (
              <>
                <div className={styles.label}>Welcome {user.firstName}!</div>
                <StudyGroups
                  selectedStudyGroup={selectedStudyGroup}
                  setSelectedStudyGroup={setSelectedStudyGroup}
                />
                <SendMessageForm
                  messages={messages}
                  setMessages={setMessages}
                  refreshMessages={fetchMessagesForGroup}
                  selectedStudyGroup={selectedStudyGroup}
                />
                <ChatMessages messages={messages} setMessages={setMessages} />
              </>
            ) : (
              <>
                <div className={styles.welcome}>
                  <p>Succeed Together <br></br>Join virtual study groups tailord to your subjects and thrive together</p>
                  <div className={styles.welcomeSignUp}>
                    <SignUpButton />
                  </div>
                </div>
              <div className ={styles.descriptions}>
                    <p>Dive into seamless collaboration <br></br>with integrated video sessions, <br></br>whiteboards
                      , and chat. Turn<br></br>study hours into interactive <br></br>brainstorming sessions
                    </p>
                    <p>Discover groups that match <br></br>your courses and interests.<br></br>
                      Whether it's calculus or<br></br>classis literature, there's a<br></br>
                      squad waiting for you.
                    </p>
                    <p>Success a trasure trove of <br></br>shard notes, practice papers<br></br>
                      and study materials. Every<br></br>group member contributes,<br></br>and everyone benefits!
                    </p>
                  
                </div>  
              </>
              
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
      <img src="strive\public\strive_logo.png" alt="Strive Logo"></img>
      {isSignedIn ? (
        <UserButton />
      ) : (
        <div>
          <div className={styles.accountIn}>
            <SignInButton />
          </div>
            &nbsp;
          <div className={styles.accountUp}>
            <SignUpButton />
          </div>
        </div>
        
      )}
    </header>
  );
};
