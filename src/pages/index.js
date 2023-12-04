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
import { Button, Box } from "@mui/material";

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
      <button className={styles.searchButton} onClick={onClose}>
        Close
      </button>
      <input
        type="text"
        placeholder="Search groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="group-list">
        {filteredGroups.map((group) => (
          <div key={group.id} className={styles.groupItem}>
            {group.name}
            <button className={styles.infoButton}>
              Info
              <span className={styles.tooltip}>{group.description}</span>
            </button>
            {!isUserMember(group.id) && (
              <button
                className={styles.searchButton}
                onClick={() => joinGroup(group.id)}
              >
                Join
              </button>
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
          <span dangerouslySetInnerHTML={{ __html: message?.text }}></span>
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
    const intervalId = setInterval(fetchGroups, 3000);

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
                <li key={group.id}>
                  <div>
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
  const [groupDescription, setGroupDescription] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);

      const { data: existingGroups, error: groupError } = await supabase
        .from("study_group")
        .select("id")
        .eq("name", groupName);

      if (groupError) throw groupError;

      if (existingGroups.length > 0) {
        alert("A group with this name already exists.");
        return;
      }

      let { error } = await supabase
        .from("study_group")
        .insert([{ name: groupName, description: groupDescription }]);

      if (error) throw error;

      let { data: groups, error: fetchError } = await supabase
        .from("study_group")
        .select("id")
        .eq("name", groupName)
        .eq("description", groupDescription)
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
      setGroupDescription("");
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
      <button className={styles.createButton} onClick={show}>
        Create Group
      </button>
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
          <br></br>
          <label>
            Enter description for group:
            <input
              type="text"
              name="desc"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
            />
          </label>
          <button className={styles.createButton} type="submit">
            Create
          </button>
        </form>
      )}
    </div>
  );
}

function CreateEventForm({ currentStudyGroup }) {
  const { getToken, userId } = useAuth();
  const [eventName, setEventName] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);

      let { error } = await supabase.from("events").insert([
        {
          name: eventName,
          description: eventDescription,
          date: eventDate,
          study_group: currentStudyGroup,
        },
      ]);

      if (error) throw error;

      // Clear the form
      setEventName("");
      setEventDescription("");
      setEventDate("");
      setShowForm(false);
    } catch (error) {
      console.error("Error during event creation:", error);
    }
  };

  const show = () => {
    setShowForm(!showForm);
  };

  return (
    <div>
      <button className={styles.createButton} onClick={show}>
        Create Event
      </button>
      {showForm && (
        <form className={styles.createEventInput} onSubmit={handleSubmit}>
          <label>
            Enter name of event:
            <input
              type="text"
              name="name"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
            />
          </label>
          <br />
          <label>
            Enter description for event:
            <input
              type="text"
              name="desc"
              value={eventDescription}
              onChange={(e) => setEventDescription(e.target.value)}
            />
          </label>
          <br />
          <label>
            Enter date for event:
            <input
              type="date"
              name="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
            />
          </label>
          <br />
          <button className={styles.createButton} type="submit">
            Create
          </button>
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
  const [selectedFileName, setSelectedFileName] = useState("");
  const fileInputRef = useRef(null);

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

    if (!newMessage && !file) {
      console.log("No message or file to send");
      return;
    }

    try {
      const supabaseAccessToken = await getToken({ template: "supabase" });
      const supabase = await supabaseClient(supabaseAccessToken);
      let fileURL = "";

      // Check if a file is selected for upload
      if (file) {
        const fileName = `${selectedStudyGroup}/${Date.now()}-${file.name}`;
        const filePath = `${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("studygroupfiles")
          .upload(filePath, file);

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          return;
        }

        // Get the public URL for the new file
        const response = await supabase.storage
          .from("studygroupfiles")
          .getPublicUrl(filePath);

        if (response.error) {
          console.error("Error getting file URL:", response.error);
          return;
        }

        fileURL = response.data.publicUrl;

        const { error: dbError } = await supabase.from("resource").insert({
          path: fileURL,
          name: file.name,
          type: file.type,
          size: file.size,
          study_group: selectedStudyGroup,
          user_id: userId,
        });

        if (dbError) {
          console.error("Error saving file info to database:", dbError);
        }
      }

      // Construct the message content
      let messageContent = newMessage;
      if (fileURL) {
        const fileType = file.type.split("/")[0];
        const fileMessage =
          fileType === "image"
            ? `<img src="${fileURL}" alt="${file.name}"/>`
            : `<a href="${fileURL}?download=" target="_blank" download style = "color: blue;">${file.name}</a>`;

        messageContent += messageContent ? " " + fileMessage : fileMessage;
      }

      // Send the message
      const { error: messageError } = await supabase.from("message").insert({
        text: messageContent,
        user_id: userId,
        study_group: selectedStudyGroup,
      });

      if (messageError) {
        console.error("Error sending message:", messageError);
        return;
      }

      if(fileInputRef.current){
        fileInputRef.current.value = "";

      }
      refreshMessages();
      setNewMessage("");
      setFile(null);
      setSelectedFileName(""); // Clear the selected file name
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const [file, setFile] = useState(null);

  const handleFileChange = (e) => {
    const newFile = e.target.files[0];
    if (newFile) {
      setFile(newFile); // Update the file state
      setSelectedFileName(newFile.name); // Update the selected file name
    }
  };
  

  return (
    <form className={styles.sendMessageForm} onSubmit={handleSubmit}>
      <label for='file-input'>
        <img src='https://www.freeiconspng.com/uploads/paper-clip-icon-24.png' width='40' style={{cursor: 'pointer'}}/>
      </label>
      
      <input id='file-input' type="file" onChange={handleFileChange} style={{ display: 'none' }} ref={fileInputRef}/>
      {selectedFileName && <span className={styles.selectedFile}>{selectedFileName}</span>}
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
        .eq("user_id", userId);

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
  }, [isLoading, isSignedIn, user, getToken]);

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
                    <button
                      className={styles.createButton}
                      onClick={toggleSearch}
                    >
                      Find Group
                    </button>
                    <CreateGroupForm />
                    <CreateEventForm currentStudyGroup={selectedStudyGroup} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className={styles.banner}>
                  <div className={styles.welcomeSignUp}>
                    <div>
                      <p className={styles.mainText}>Succeed Together.</p>
                      <p
                        style={{
                          textAlign: "center",
                          marginLeft: 50,
                          marginRight: 50,
                        }}
                      >
                        Join virtual study groups tailored to your subjects and
                        STRIVE for greatness
                      </p>
                      <div className={styles.signUpDiv}>
                        <SignUpButton className={styles.signUp} />
                      </div>
                    </div>
                  </div>
                  <img
                    className={styles.image}
                    src="https://i.imgur.com/jOH1c0q.png"
                  />
                </div>
                <div className={styles.descriptions}>
                  <div style={{ marginLeft: 60, marginRight: 60 }}>
                    <p className={styles.descriptionTitle}>
                      Collaborative Learning Hub
                    </p>
                    <p className={styles.descriptionText}>
                      Dive into seamless collaboration with video sessions,
                      whiteboards, and chat. Turn study hours into interactive
                      brainstorming sessions
                    </p>
                  </div>
                  <img
                    src="https://i.imgur.com/fqsGrnG.png"
                    className={styles.line}
                  />
                  <div style={{ marginLeft: 60, marginRight: 60 }}>
                    <p className={styles.descriptionTitle}>
                      Tailored Study Groups
                    </p>
                    <p className={styles.descriptionText}>
                      Discover groups that match your courses and interests.
                      Whether it is calculus or classic literature, there is a
                      squad waiting for you.
                    </p>
                  </div>
                  <img
                    src="https://i.imgur.com/fqsGrnG.png"
                    className={styles.line}
                  />
                  <div style={{ marginLeft: 60, marginRight: 60 }}>
                    <p className={styles.descriptionTitle}>Resource Central</p>
                    <p className={styles.descriptionText}>
                      Access a treasure trove of shared notes, practice papers
                      and study materials. Every group member contributes, and
                      everyone benefits!
                    </p>
                  </div>
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
      <img
        src="https://i.imgur.com/8Dc5Svm.png"
        style={{ width: 25, float: "left" }}
      ></img>
      <div style={{ marginLeft: 20, float: "left", marginTop: 3 }}>STRIVE</div>
      {isSignedIn ? (
        <div style={{ float: "right" }}>
          <UserButton afterSignOutUrl="/" />
        </div>
      ) : (
        <div style={{ float: "right" }}>
          <SignInButton style={{ marginRight: 20 }} />
          &nbsp;
          <SignUpButton />
        </div>
      )}
    </header>
  );
};
