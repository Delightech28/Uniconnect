import React, { useState, useEffect } from 'react'; 
import { auth, db, storage } from '../firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useTheme } from '../hooks/useTheme';
import AppHeader from './AppHeader';
import Footer from './Footer';
import { notifyPostCreated } from '../services/notificationService';
import { getDefaultAvatar } from '../services/avatarService';
 
// --- Helper Components --- 
 
 

// Toolbar for the rich text editor — adds simple markdown/HTML formatting
const EditorToolbar = ({ content, setContent }) => {
    const buttons = [
        'format_h1', 'format_h2', 'format_bold', 'format_italic',
        'format_underlined', 'format_strikethrough',
        { type: 'divider' },
        'format_list_bulleted', 'format_list_numbered', 'format_quote',
        { type: 'divider' },
        'link', 'image', 'play_circle'
    ];

    const getTextarea = () => document.getElementById('post-content-textarea');

    const replaceSelection = (newText, selectStartOffset = 0, selectEndOffset = 0) => {
        const ta = getTextarea();
        if (!ta) {
            setContent(newText);
            return;
        }
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = content.slice(0, start);
        const after = content.slice(end);
        const updated = before + newText + after;
        setContent(updated);
        // restore focus and selection
        requestAnimationFrame(() => {
            ta.focus();
            const newStart = start + selectStartOffset;
            const newEnd = start + newText.length - selectEndOffset;
            ta.setSelectionRange(newStart, newEnd);
        });
    };

    const formatInline = (wrapperLeft, wrapperRight = wrapperLeft) => {
        const ta = getTextarea();
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end);
        if (selected.length === 0) {
            const insertion = wrapperLeft + wrapperRight;
            replaceSelection(insertion, wrapperLeft.length, wrapperRight.length);
        } else {
            replaceSelection(wrapperLeft + selected + wrapperRight);
        }
    };

    const formatBlock = (prefix) => {
        const ta = getTextarea();
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end);
        const lines = selected.split(/\n/);
        const prefixed = lines.map(l => (l.trim().length ? prefix + l : l)).join('\n');
        replaceSelection(prefixed);
    };

    const formatNumberedList = () => {
        const ta = getTextarea();
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end);
        const lines = selected.split(/\n/);
        const prefixed = lines.map((l, i) => (l.trim().length ? `${i + 1}. ${l}` : l)).join('\n');
        replaceSelection(prefixed);
    };

    const insertLinkOrMedia = async (type) => {
        const ta = getTextarea();
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = content.slice(start, end) || 'link-text';

        if (type === 'link') {
            const url = window.prompt('Enter URL');
            if (!url) return;
            replaceSelection(`[${selected}](${url})`);
            return;
        }

        // image or video: open file picker and upload to Firebase Storage
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'image' ? 'image/*' : 'video/*';
        input.onchange = async (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            try {
                const uid = auth.currentUser?.uid || 'anonymous';
                const path = `posts_media/${uid}/${Date.now()}_${file.name}`;
                const storageReference = storageRef(storage, path);
                const uploadTask = uploadBytesResumable(storageReference, file);
                const toastId = toast.loading('Uploading media...');
                uploadTask.on('state_changed', (snapshot) => {
                    // optionally could update progress: snapshot.bytesTransferred / snapshot.totalBytes
                }, async (err) => {
                    console.error('Upload error', err);
                    toast.dismiss(toastId);
                    toast.error('Upload failed — you can paste a public URL instead.');
                    // fallback: prompt user to paste a public URL
                    const fallback = window.prompt('Upload failed. Paste a public URL for the media (or Cancel to abort)');
                    if (fallback) {
                        if (type === 'image') {
                            replaceSelection(`![${selected}](${fallback})`);
                        } else {
                            replaceSelection(`[video](${fallback})`);
                        }
                    }
                }, async () => {
                    try {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        if (type === 'image') {
                            replaceSelection(`![${selected}](${url})`);
                        } else {
                            replaceSelection(`[video](${url})`);
                        }
                        toast.success('Upload complete');
                    } catch (err) {
                        console.error('Failed to get download URL', err);
                        toast.error('Upload succeeded but failed to retrieve URL. Paste a public URL instead.');
                        const fallback = window.prompt('Paste a public URL for the media (or Cancel to abort)');
                        if (fallback) {
                            if (type === 'image') {
                                replaceSelection(`![${selected}](${fallback})`);
                            } else {
                                replaceSelection(`[video](${fallback})`);
                            }
                        }
                    } finally {
                        toast.dismiss(toastId);
                    }
                });
            } catch (err) {
                console.error('Media upload failed', err);
                toast.error('Media upload failed — you can paste a public URL instead.');
                const fallback = window.prompt('Upload failed. Paste a public URL for the media (or Cancel to abort)');
                if (fallback) {
                    if (type === 'image') {
                        replaceSelection(`![${selected}](${fallback})`);
                    } else {
                        replaceSelection(`[video](${fallback})`);
                    }
                }
            }
        };
        input.click();
    };

    const handleClick = (btn) => {
        if (btn.type === 'divider') return;
        switch (btn) {
            case 'format_h1': return formatBlock('# ');
            case 'format_h2': return formatBlock('## ');
            case 'format_bold': return formatInline('**');
            case 'format_italic': return formatInline('*');
            case 'format_underlined': return formatInline('<u>', '</u>');
            case 'format_strikethrough': return formatInline('~~');
            case 'format_list_bulleted': return formatBlock('- ');
            case 'format_list_numbered': return formatNumberedList();
            case 'format_quote': return formatBlock('> ');
            case 'link': return insertLinkOrMedia('link');
            case 'image': return insertLinkOrMedia('image');
            case 'play_circle': return insertLinkOrMedia('play_circle');
            default: return;
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-border-light dark:border-border-dark px-3 py-2">
            {buttons.map((btn, index) => {
                if (btn.type === 'divider') {
                    return <div key={`divider-${index}`} className="h-5 w-px bg-border-light dark:bg-border-dark mx-1"></div>;
                }
                return (
                    <button key={btn} onClick={() => handleClick(btn)} type="button" className="flex items-center justify-center p-2 rounded hover:bg-primary-light dark:hover:bg-primary/30">
                        <span className="material-symbols-outlined text-text-light dark:text-text-dark text-base">{btn}</span>
                    </button>
                );
            })}
        </div>
    );
};
 
// Component for handling the dynamic tag input 
const TagInput = ({ tags, setTags }) => { 
    const [inputValue, setInputValue] = useState(''); 
 
    const handleKeyDown = (e) => { 
        if (e.key === 'Enter' || e.key === ',') { 
 

            e.preventDefault(); 
            const newTag = inputValue.trim().toLowerCase(); 
            if (newTag && tags.length < 5 && !tags.includes(newTag)) { 
                setTags([...tags, newTag]); 
            } 
            setInputValue(''); 
        } 
    }; 
 
    const removeTag = (tagToRemove) => { 
        setTags(tags.filter(tag => tag !== tagToRemove)); 
    }; 
 
    return ( 
        <div className="space-y-3"> 
            <p className="text-text-light dark:text-text-dark text-base 
font-medium leading-normal">Add Tags (up to {5 - tags.length} 
remaining)</p> 
            <div className="flex items-center gap-2 flex-wrap p-3 border 
border-border-light dark:border-border-dark rounded-lg"> 
                {tags.map(tag => ( 
                    <div key={tag} className="flex h-8 shrink-0 items-center 
justify-center gap-x-2 rounded-full bg-primary-light dark:bg-primary/30 
pl-3 pr-2"> 
                        <p className="text-primary dark:text-green-200 text-sm 
font-medium leading-normal">{tag}</p> 
                        <button onClick={() => removeTag(tag)} 
className="p-0.5 rounded-full hover:bg-primary/20 
dark:hover:bg-primary/50"> 
                            <span className="material-symbols-outlined 
text-primary dark:text-green-200 text-sm">close</span> 
                        </button> 
                    </div> 
                ))} 
                <input 
 

                    className="form-input flex-1 min-w-[150px] bg-transparent 
border-0 p-1 focus:ring-0 text-text-light dark:text-text-dark 
placeholder:text-slate-400 dark:placeholder:text-slate-500" 
                    placeholder={tags.length < 5 ? "e.g., Exams, Campus Life..." : "Maximum tags reached"} 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)} 
                    onKeyDown={handleKeyDown} 
                    disabled={tags.length >= 5} 
                /> 
            </div> 
        </div> 
    ); 
}; 
 
// --- Main Page Component --- 
function CreatePostPage() { 
    const { postId } = useParams();
    const isEditMode = !!postId;
    
    const [post, setPost] = useState({ 
        title: '', 
        content: '', 
        tags: [],
    }); 
    const [isPublishing, setIsPublishing] = useState(false);
    const [isLoadingPost, setIsLoadingPost] = useState(isEditMode);
    const navigate = useNavigate();
    const { darkMode, toggleTheme } = useTheme();
    const [status, setStatus] = useState({ 
        message: isEditMode ? 'Editing' : 'Draft', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: 
'2-digit' }) 
    }); 
 
    // Load post data if in edit mode
    useEffect(() => {
        if (isEditMode) {
            const loadPost = async () => {
                try {
                    const postDocRef = doc(db, 'posts', postId);
                    const postDocSnap = await getDoc(postDocRef);
                    if (postDocSnap.exists()) {
                        const postData = postDocSnap.data();
                        // Verify the current user is the author
                        if (postData.authorId !== auth.currentUser?.uid) {
                            toast.error('You can only edit your own posts');
                            navigate('/campusfeed');
                            return;
                        }
                        setPost({
                            title: postData.title,
                            content: postData.content,
                            tags: postData.tags || []
                        });
                    } else {
                        toast.error('Post not found');
                        navigate('/campusfeed');
                    }
                } catch (err) {
                    console.error('Failed to load post:', err);
                    toast.error('Failed to load post');
                    navigate('/campusfeed');
                } finally {
                    setIsLoadingPost(false);
                }
            };
            loadPost();
        }
    }, [postId, isEditMode, navigate]);
 
    const handleInputChange = (e) => { 
        const { name, value } = e.target; 
        setPost(prev => ({ ...prev, [name]: value })); 
    }; 
 
    const setTags = (newTags) => { 
        setPost(prev => ({ ...prev, tags: newTags })); 
    }; 
 
 
 
    // Auto-save simulation 
    useEffect(() => { 
        const interval = setInterval(() => { 
            // In a real app, this would be an API call to save the draft. 
            // For now, we just update the timestamp. 
            setStatus({ 
                message: isEditMode ? 'Editing' : 'Draft', 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: 
'2-digit' }) 
            }); 
            console.log('Draft auto-saved!'); 
        }, 30000); // Auto-save every 30 seconds 
 
        return () => clearInterval(interval); 
    }, []); 
 
    const handlePublish = async () => { 
        if (!post.title || !post.content) { 
            toast.error('Please add a title and content before publishing.'); 
            return; 
        }
        setIsPublishing(true);
        try {
            if (isEditMode) {
                // Update existing post
                const postDocRef = doc(db, 'posts', postId);
                await updateDoc(postDocRef, {
                    title: post.title,
                    content: post.content,
                    tags: post.tags || [],
                    updatedAt: serverTimestamp(),
                });
                toast.success('Post updated');
            } else {
                // Create new post
                const user = auth.currentUser;
                let author = {
                    id: null,
                    name: 'Anonymous',
                    avatarUrl: getDefaultAvatar('male')
                };
                if (user) {
                    author.id = user.uid;
                    // Attempt to read displayName/avatar from users collection
                    try {
                        const uDoc = await getDoc(doc(db, 'users', user.uid));
                        if (uDoc.exists()) {
                            const d = uDoc.data();
                            author.name = d.displayName || d.fullName || user.email?.split('@')[0] || 'User';
                            author.avatarUrl = d.avatarUrl || getDefaultAvatar(d.gender || 'male');
                        } else {
                            author.name = user.email?.split('@')[0] || 'User';
                        }
                    } catch (err) {
                        console.warn('Could not fetch user profile for post author', err);
                        author.name = user.email?.split('@')[0] || 'User';
                        author.avatarUrl = getDefaultAvatar('male');
                    }
                }

                const postDoc = {
                    title: post.title,
                    content: post.content,
                    tags: post.tags || [],
                    authorId: author.id,
                    authorName: author.name,
                    authorAvatar: author.avatarUrl,
                    likesCount: 0,
                    commentsCount: 0,
                    createdAt: serverTimestamp(),
                };

                const postRef = await addDoc(collection(db, 'posts'), postDoc);
                
                                // Send notification to the author and optionally broadcast to all users
                                if (author.id) {
                                    try {
                                        await notifyPostCreated(author.id, {
                                            id: postRef.id,
                                            title: post.title,
                                        });
                                    } catch (notifErr) {
                                        console.warn('Failed to send post notification to author:', notifErr);
                                    }
                                }
                                // Fan-out to all users (exclude author)
                                try {
                                    await notifyAllUsersPostCreated({ id: postRef.id, title: post.title }, author.id);
                                } catch (broadcastErr) {
                                    console.warn('Failed to broadcast post notification:', broadcastErr);
                                }

                toast.success('Post published');
            }
            
            setPost({ title: '', content: '', tags: [] });
            setIsPublishing(false);
            navigate('/campusfeed');
        } catch (err) {
            console.error('Failed to publish post', err);
            toast.error('Failed to publish post');
            setIsPublishing(false);
        }
    }; 
 
    if (isLoadingPost) {
        return (
            <div className="bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col">
                <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
                <div className="flex-1 flex items-center justify-center">
                    <p>Loading post...</p>
                </div>
                <Footer darkMode={darkMode} />
            </div>
        );
    }
 
    return ( 
        <div className="bg-background-light dark:bg-background-dark 
text-text-light dark:text-text-dark min-h-screen flex flex-col"> 
            <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />
            <div className="flex flex-1 justify-center py-5"> 
                <div className="w-full max-w-[960px] flex-1"> 
                    <header className="flex items-center justify-between 
whitespace-nowrap border-b border-solid border-border-light 
dark:border-border-dark px-4 sm:px-10 py-3"> 
                       {/* Header content from HTML */} 
                    </header> 
                    <main className="p-4 sm:p-6 md:p-10 space-y-8"> 
 

                        <h1 className="text-3xl sm:text-4xl font-black 
tracking-[-0.033em]">{isEditMode ? 'Edit Post' : 'Create a New Post'}</h1> 
 
                        <div className="space-y-6"> 
                            <div> 
                                <label htmlFor="title" className="text-base 
font-medium leading-normal pb-2 block">Post Title</label> 
                                <input 
                                    id="title" 
                                    name="title" 
                                    value={post.title} 
                                    onChange={handleInputChange} 
                                    className="form-input w-full rounded-lg 
focus:outline-0 focus:ring-2 focus:ring-primary-accent border 
border-border-light dark:border-border-dark bg-background-light 
dark:bg-background-dark h-14 placeholder:text-slate-400 
dark:placeholder:text-slate-500 p-[15px] text-base" 
                                    placeholder="Enter your post title here..." 
                                /> 
                            </div> 
 
                            <div> 
                                <p className="text-base font-medium 
leading-normal pb-2">Post Content</p> 
                                <div className="rounded-lg border 
border-border-light dark:border-border-dark bg-background-light 
dark:bg-background-dark"> 
                                    <EditorToolbar content={post.content} setContent={(c) => setPost(prev => ({ ...prev, content: c }))} /> 
                                    <textarea 
                                        id="post-content-textarea"
                                        name="content" 
                                        value={post.content} 
                                        onChange={handleInputChange} 
                                        className="form-input w-full resize-y 
rounded-b-lg focus:outline-0 focus:ring-0 border-0 bg-transparent 
min-h-72 placeholder:text-slate-400 dark:placeholder:text-slate-500 p-4 
text-base" 
                                        placeholder="Start writing your story..." 
 

                                    ></textarea> 
                                </div> 
                            </div> 
                             
                            <TagInput tags={post.tags} setTags={setTags} /> 
                        </div> 
 
                        <div className="flex flex-wrap items-center 
                                justify-between gap-4 pt-6 border-t border-border-light 
                                dark:border-border-dark"> 
                            <p className="text-slate-500 dark:text-slate-400 
                                text-sm">Status: <span 
                            className="font-medium">{status.message}</span>. Last saved at {" "}{status.time}</p> 
                            <div className="flex items-center gap-3"> 
                                <button 
                                    onClick={() => navigate('/campusfeed')}
                                    className="min-w-[84px] rounded-lg h-10 
px-4 bg-transparent border border-border-light dark:border-border-dark 
text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"> 
                                    <span>Cancel</span> 
                                </button> 
                                <button 
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className={`min-w-[84px] rounded-lg h-10 px-4 text-white 
text-sm font-medium transition-colors ${
                                        isPublishing 
                                            ? 'bg-primary/60 cursor-not-allowed' 
                                            : 'bg-primary hover:bg-primary-accent'
                                    }`}
                                > 
                                    <span>{isPublishing ? 'Saving...' : isEditMode ? 'Update' : 'Publish'}</span> 
                                </button> 
                            </div> 
                        </div> 
                    </main> 
                </div> 
            </div>
            <Footer darkMode={darkMode} />
        </div> 
    ); 
} 
 
export default CreatePostPage; 


