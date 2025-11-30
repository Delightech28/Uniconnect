import React, { useState, useEffect } from 'react'; 
 
// --- Helper Components --- 
 
 

// Toolbar for the rich text editor 
const EditorToolbar = () => { 
    const buttons = [ 
        'format_h1', 'format_h2', 'format_bold', 'format_italic', 
'format_underlined', 'format_strikethrough', 
        { type: 'divider' }, 
        'format_list_bulleted', 'format_list_numbered', 'format_quote', 
        { type: 'divider' }, 
        'link', 'image', 'play_circle' 
    ]; 
    return ( 
        <div className="flex flex-wrap items-center gap-1 border-b 
border-border-light dark:border-border-dark px-3 py-2"> 
            {buttons.map((btn, index) => { 
                if (btn.type === 'divider') { 
                    return <div key={`divider-${index}`} className="h-5 w-px 
bg-border-light dark:bg-border-dark mx-1"></div>; 
                } 
                return ( 
                    <button key={btn} className="flex items-center 
justify-center p-2 rounded hover:bg-primary-light 
dark:hover:bg-primary/30"> 
                        <span className="material-symbols-outlined 
text-text-light dark:text-text-dark text-base">{btn}</span> 
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
    const [post, setPost] = useState({ 
        title: '', 
        content: '', 
        tags: ['academics', 'events'], 
    }); 
    const [status, setStatus] = useState({ 
        message: 'Draft', 
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: 
'2-digit' }) 
    }); 
 
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
                message: 'Draft', 
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: 
'2-digit' }) 
            }); 
            console.log('Draft auto-saved!'); 
        }, 30000); // Auto-save every 30 seconds 
 
        return () => clearInterval(interval); 
    }, []); 
 
    const handlePublish = () => { 
        if (!post.title || !post.content) { 
            alert('Please add a title and content before publishing.'); 
            return; 
        } 
        alert('Post Published!\n\n' + JSON.stringify(post, null, 2)); 
        // Reset form or redirect 
        setPost({ title: '', content: '', tags: [] }); 
    }; 
 
    return ( 
        <div className="bg-background-light dark:bg-background-dark 
text-text-light dark:text-text-dark min-h-screen"> 
            <div className="flex flex-1 justify-center py-5"> 
                <div className="w-full max-w-[960px] flex-1"> 
                    <header className="flex items-center justify-between 
whitespace-nowrap border-b border-solid border-border-light 
dark:border-border-dark px-4 sm:px-10 py-3"> 
                       {/* Header content from HTML */} 
                    </header> 
                    <main className="p-4 sm:p-6 md:p-10 space-y-8"> 
 

                        <h1 className="text-3xl sm:text-4xl font-black 
tracking-[-0.033em]">Create a New Post</h1> 
 
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
                                    <EditorToolbar /> 
                                    <textarea 
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
className="font-medium">{status.message}</span>. Last saved at 
{status.time}</p> 
                            <div className="flex items-center gap-3"> 
                                <button className="min-w-[84px] rounded-lg h-10 
px-4 bg-transparent border border-border-light dark:border-border-dark 
text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700"> 
                                    <span>Save Draft</span> 
                                </button> 
                                <button onClick={handlePublish} 
className="min-w-[84px] rounded-lg h-10 px-4 bg-primary text-white 
text-sm font-medium hover:bg-primary-accent"> 
                                    <span>Publish</span> 
                                </button> 
                            </div> 
                        </div> 
                    </main> 
                </div> 
            </div> 
        </div> 
    ); 
} 
 
export default CreatePostPage; 