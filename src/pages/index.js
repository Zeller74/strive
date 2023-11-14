import styles from "../styles/Home.module.css";
import { useState, useEffect, useRef } from "react";

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
import { Button } from "@mui/material";

//import icons from react icons
import { FaRegHeart } from "react-icons/fa";
import { FiArrowLeftCircle, FiArrowRightCircle } from "react-icons/fi";

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

const SearchGroups = ({ isVisible, onClose }) => {
  const { getToken, userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]); // To store the user's groups

  useEffect(() => {
    const fetchGroupsAndUserGroups = async () => {
      if (!isVisible) return;

      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);

      // Fetch all groups
      const { data: allGroupsData } = await supabase
        .from("study_group")
        .select("*");
      setGroups(allGroupsData);

      // Fetch the groups the user is a member of
      const { data: userGroupsData } = await supabase
        .from("enrollment")
        .select("study_group")
        .eq("user_id", userId);
      setUserGroups(userGroupsData.map((enrollment) => enrollment.study_group));
    };

    fetchGroupsAndUserGroups();
  }, [isVisible, getToken, userId]);

  const joinGroup = async (groupId) => {
    const supabaseAccessToken = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(supabaseAccessToken);
    await supabase
      .from("enrollment")
      .insert({ user_id: userId, study_group: groupId });

    setUserGroups([...userGroups, groupId]);
  };

  const isUserMember = (groupId) => {
    return userGroups.includes(groupId);
  };

  const filteredGroups = searchTerm
    ? groups.filter((group) =>
        group.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : groups;

  if (!isVisible) return null;

  return (
    <div className="search-container">
      <button className={styles.searchButton} onClick={onClose}>Close</button>
      <input
        type="text"
        placeholder="Search groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="group-list">
        {filteredGroups.map((group) => (
          <div key={group.id} className="group-item">
            {group.name}
            {!isUserMember(group.id) && (
              <button className={styles.searchButton} onClick={() => joinGroup(group.id)}>Join</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const ChatMessages = ({ messages, setMessages }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="chatContainer" ref={containerRef}>
      {messages?.filter(Boolean).map((message) => (
        <div key={message.id}>
          <strong>{message.user?.name ?? "Unknown User"}</strong>:{" "}
          {message?.text ?? "Message not available"}
        </div>
      ))}
    </div>
  );
};

function StudyGroups({ selectedStudyGroup, setSelectedStudyGroup }) {
  const { getToken, userId } = useAuth();
  const [groups, setGroups] = useState([]);
  const [userGroups, setUserGroups] = useState([]);
  const [isInitialGroupSet, setIsInitialGroupSet] = useState(false); // New state variable

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

      setGroups(allGroupsData); // This will set the list of ALL study groups
      setUserGroups(userEnrollments.map((e) => e.study_group)); // This will set only the ones user is part of

      if (!isInitialGroupSet && userEnrollments.length > 0) {
        setSelectedStudyGroup(userEnrollments[0].study_group);
        setIsInitialGroupSet(true); // Set the flag to true after setting the initial group
      }
    };

    fetchGroups();
    const intervalId = setInterval(fetchGroups, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [userId, setSelectedStudyGroup, isInitialGroupSet]);

  const leaveGroup = async (groupId) => {
    console.log("Attempting to leave group with ID:", groupId);

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
  const [menuCollapse, setMenuCollapse] = useState(false);

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
            <p>{menuCollapse ? "" : "Groups"}</p>
          </div>
          <div className="closemenu" onClick={menuIconClick}>
            {menuCollapse ? <FiArrowRightCircle /> : <FiArrowLeftCircle />}
          </div>
        </SidebarHeader>
        <SidebarContent>
          <Menu iconShape="square">
            {userGroups.map((groupId) => {
              const group = groups.find((g) => g.id === groupId);
              if (!group) return null;
              return (
                <li>
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
                      <Button
                        sx={{ m: 1 }}
                        onClick={() => leaveGroup(group.id)}
                        variant="contained"
                        size="small"
                        style={{
                          maxWidth: "50px",
                          maxHeight: "25px",
                          minWidth: "50px",
                          minHeight: "25px",
                        }}
                      >
                        <p>{menuCollapse ? "" : "Leave"}</p>
                      </Button>
                    </MenuItem>
                  </div>
                </li>
              );
            })}
            {/* <ul>
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
          </ul> */}
          </Menu>
        </SidebarContent>
      </ProSidebar>
    </div>
  );
}

function CreateGroupForm() {
  const { getToken, userId } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);

      let { error } = await supabase
        .from("study_group")
        .insert([{ name: groupName }]);

      if (error) throw error;

      // Step 2: Add the user to the enrollment table with the new group ID
      let { data: groups, error: fetchError } = await supabase
        .from("study_group")
        .select("id")
        .eq("name", groupName)
        .order("created_at", { ascending: false })
        .limit(1);

      if (fetchError) throw fetchError;
      if (!groups || groups.length === 0) {
        throw new Error("New group was not found.");
      }
      const newGroupId = groups[0].id;

      let { error: joinError } = await supabase
        .from("enrollment")
        .insert([{ study_group: newGroupId, user_id: userId }]);

      if (joinError) throw joinError;

      // If everything is successful, clear the form
      setGroupName("");
      setShowForm(false);
    } catch (error) {
      console.error("Error during group creation and joining:", error);
    }
  };

  const show = () => {
    setShowForm(!showForm);
  };

  return (
    <div>
      <button className={styles.createButton} onClick={show}>Create Group</button>
      {showForm && (
        <form className={styles.createGroupInput} onSubmit={handleSubmit}>
          <label>
            Enter name of group:
            <input
              type="text"
              name="name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </label>
          <button className={styles.createButton} type="submit">Create</button>
        </form>
      )}
    </div>
  );
}

function SendMessageForm({
  messages,
  setMessages,
  refreshMessages,
  selectedStudyGroup,
}) {
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
  const [isSearchVisible, setSearchVisible] = useState(false);

  // Function to handle opening and closing the search section
  const toggleSearch = () => {
    setSearchVisible(!isSearchVisible);
  };

  async function fetchMessagesForGroup() {
    const supabaseAccessToken = await getToken({ template: "supabase" });
    const supabase = await supabaseClient(supabaseAccessToken);

    // Fetch messages for the group
    const { data: groupMessages, error: error1 } = await supabase
      .from("message")
      .select("*")
      .match({ study_group: selectedStudyGroup })
      .order("id", { ascending: true });

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
        <main className={styles.main}>
          <div className={styles.container}>
            {isSignedIn ? (
              <>
                <div className={styles.label}>Welcome {user.firstName}!</div>
                <div className={styles.studyGroupContainer}>
                  {/* Sidebar with study groups on the left */}
                  <StudyGroups
                    selectedStudyGroup={selectedStudyGroup}
                    setSelectedStudyGroup={setSelectedStudyGroup}
                  />

                  {/* Chat and message form on the right */}
                  <div className={styles.chatContainer}>
                    <SendMessageForm
                      messages={messages}
                      setMessages={setMessages}
                      refreshMessages={fetchMessagesForGroup}
                      selectedStudyGroup={selectedStudyGroup}
                    />
                    <ChatMessages
                      messages={messages}
                      setMessages={setMessages}
                    />
                  </div>


                  {/* Search Section */}
                  <div style={{ display: isSearchVisible ? "block" : "none" }}>
                    <SearchGroups
                      getToken={getToken}
                      isVisible={isSearchVisible}
                      onClose={toggleSearch}
                    />
                  </div>
                  <div>
                    <button className={styles.createButton} onClick={toggleSearch}>Find Group</button>
                    <CreateGroupForm />
                    </div>
                </div>
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
                      Whether it's calculus or<br></br>classis literature, there's <br></br>a squad waiting for you.
                    </p>
                    <p>Success a trasure trove of <br></br>shard notes, practice papers<br></br>
                      and study materials. Every<br></br>group member contributes,<br></br>and everyone benefits!
                    </p>
                </div>
             
                <footer className={styles.footer}>
                      <div className={styles.footerContent}>
                        <div className={styles.footerLeft}>
                          <h3>About Us</h3>
                          <p>Strive is a small team consisting of Hannah Nguyen, Jeffrey Yang, Joel Yates, Paul Adelae, and Rebecca Nguyen.
                            Our goal is to assist students in their academic journies so that they may have all the tools necessary to thrive
                            in their environment.
                          </p>
                        </div>
                        <div className={styles.footerRight}>
                          <h3>Contact Information</h3>
                          <p>Hannah: hannahn2@umbc.edu<br></br>Jeffery: jyang13@umbc.edu<br></br>Joel: jyates1@umbc.edu<br></br> 
                            Paul: padelae1@umbc.edu<br></br>Rebecca: xv46495@umbc.edu</p>
        
                        </div>
                      </div>
                      <div className={styles.footerBottom}>
                        <p>&copy; 2023 Strive. All Rights Reserved.</p>
                      </div>
                    </footer> 
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
