import React, { useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDoc, getDocs, serverTimestamp, runTransaction } from 'firebase/firestore';
import { db, auth } from '../firebase';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Footer from './Footer';
import { notifyPostLiked, notifyPostCommented } from '../services/notificationService';
import { getDefaultAvatar } from '../services/avatarService';

const PostStats = ({ likes, comments, onToggleLike, liked, onToggleComments, onShare }) => (
  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-600 dark:text-slate-400">
    <div className="flex items-center gap-4">
      <button onClick={onToggleLike} className={`flex items-center gap-1.5 ${liked ? 'text-primary' : 'hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary'} dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary`}>
        <span className="material-symbols-outlined text-xl">thumb_up</span>
        <span className="text-sm font-medium">{likes}</span>
      </button>
      <button onClick={onToggleComments} className="flex items-center gap-1.5 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary">
        <span className="material-symbols-outlined text-xl">chat_bubble</span>
        <span className="text-sm font-medium">{comments}</span>
      </button>
    </div>
    <button onClick={onShare} className="flex items-center gap-1.5 hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary dark:hover:text-primary dark:text-[#a8d5a8] dark:hover:text-primary">
      <span className="material-symbols-outlined text-xl">share</span>
      <span className="text-sm font-medium">Share</span>
    </button>
  </div>
);

const Comment = ({ img, name, isAuthor, time, text, likes, commentId, postId, onToggleLike, liked, onAvatarClick, onDelete, onReply, userId }) => {
  const [showMenu, setShowMenu] = React.useState(false);
  const currentUser = auth.currentUser;
  const isCommentAuthor = currentUser?.uid === userId;

  return (
    <div className="flex items-start gap-3 py-3">
      <img
        alt={`${name}'s profile picture`}
        onClick={onAvatarClick}
        className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
        src={img && img.length > 0 ? img : getDefaultAvatar('male')}
      />
      <div className="flex-grow min-w-0">
        <div className="bg-background-light dark:bg-slate-800 rounded-2xl p-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-semibold text-secondary dark:text-white text-sm cursor-pointer hover:underline inline-flex items-center gap-1.5" onClick={onAvatarClick}>
                {name}
                {isAuthor && <span className="text-xs font-normal bg-primary/20 text-primary px-2 py-0.5 rounded-full">Author</span>}
              </p>
            </div>
            {isCommentAuthor && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 hover:bg-slate-300/50 dark:hover:bg-slate-700/50 rounded transition-colors"
                  title="Options"
                >
                  <span className="material-symbols-outlined text-lg">more_vert</span>
                </button>
                {showMenu && (
                  <div className="absolute right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10">
                    <button
                      onClick={() => {
                        onDelete?.(postId, commentId);
                        setShowMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 transition-colors first:rounded-t-lg last:rounded-b-lg"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm mt-2 break-words">{text}</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2 px-1">
          <button
            onClick={() => onToggleLike?.(postId, commentId)}
            className={`flex items-center gap-1 font-medium transition-colors ${liked ? 'text-primary dark:text-primary' : 'hover:text-primary'}`}
          >
            <span className="material-symbols-outlined text-base">thumb_up</span>
            {likes > 0 && <span>{likes}</span>}
          </button>
          <button
            onClick={() => onReply?.(name, commentId)}
            className="flex items-center gap-1 font-medium hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-base">reply</span>
            Reply
          </button>
          <span className="text-slate-400">·</span>
          <span>{time}</span>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function CampusFeed() {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setPosts(items);
        setLoading(false);
      }, (err) => {
        console.error('Posts subscription error', err);
        setLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error('Error subscribing to posts', e);
      setLoading(false);
    }
  }, []);

  // Scroll to a post when a hash is present (e.g. /campusfeed#post-abc)
  useEffect(() => {
    if (!location?.hash) return;
    const id = location.hash.replace('#', '');
    // Wait a short moment for posts to be rendered
    const t = setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optionally highlight briefly
        el.classList.add('ring-2', 'ring-primary', 'ring-offset-2');
        setTimeout(() => el.classList.remove('ring-2', 'ring-primary', 'ring-offset-2'), 1500);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [location?.hash, posts]);
  return (
    <div>
    <div className="w-full h-screen flex flex-col">
      <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

      <main className="flex-1 overflow-y-auto px-4 sm:px-10 py-8">
            <div className="layout-content-container flex flex-col max-w-3xl mx-auto">
              {/* Page Title & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
                <h1 className="text-secondary dark:text-white text-3xl font-bold leading-tight">CampusFeed</h1>
                <button onClick={() => navigate('/create-post')} className="flex items-center justify-center gap-2 h-10 px-4 mt-4 sm:mt-0 text-sm font-bold text-white bg-primary rounded-lg">
                  <span className="material-symbols-outlined">add</span>
                  <span>New Post</span>
                </button>
              </div>

              <div className="space-y-8">
                {loading && <div className="text-center py-8">Loading posts...</div>}
                {!loading && posts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-lg text-slate-600 dark:text-slate-400">No posts yet — be the first to post!</p>
                  </div>
                )}
                {!loading && posts.map((p) => (
                  <PostItem key={p.id} post={p} />
                ))}
              </div>
            </div>
          </main>
          </div>
          <Footer darkMode={darkMode} />
    </div>
  );
}

function PostItem({ post }) {
  const navigate = useNavigate();
  const [likesCount, setLikesCount] = useState(post.likesCount || 0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentLikes, setCommentLikes] = useState({});
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [posting, setPosting] = useState(false);
  const [authorAvatar, setAuthorAvatar] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);

  // Fetch author avatar from user profile
  useEffect(() => {
    const fetchAuthorAvatar = async () => {
      if (!post.authorId) return;
      try {
        const userDocRef = doc(db, 'users', post.authorId);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const avatar = userData.avatarUrl || getDefaultAvatar(userData.gender || 'male');
          setAuthorAvatar(avatar);
        }
      } catch (err) {
        console.warn('Could not fetch author avatar:', err);
        setAuthorAvatar(getDefaultAvatar('male'));
      }
    };
    fetchAuthorAvatar();
    
    // Check if current user is the post author
    const currentUser = auth.currentUser;
    setIsAuthor(currentUser && currentUser.uid === post.authorId);
  }, [post.authorId]);

  useEffect(() => {
    const likesCol = collection(db, 'posts', post.id, 'likes');
    const unsub = onSnapshot(likesCol, (snap) => {
      setLikesCount(snap.size);
      const uid = auth.currentUser?.uid;
      if (uid) {
        setLiked(snap.docs.some(d => d.id === uid));
      } else {
        setLiked(false);
      }
    }, (err) => {
      console.error('Likes subscription error', err);
    });
    return () => unsub();
  }, [post.id]);

  // Subscribe to comments
  useEffect(() => {
    try {
      const commentsCol = collection(db, 'posts', post.id, 'comments');
      const q = query(commentsCol, orderBy('createdAt', 'asc'));
      const unsub = onSnapshot(q, (snap) => {
        const commentsList = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setComments(commentsList);
        setCommentsLoading(false);
      }, (err) => {
        console.error('Comments subscription error', err);
        setCommentsLoading(false);
      });
      return () => unsub();
    } catch (e) {
      console.error('Error subscribing to comments', e);
      setCommentsLoading(false);
    }
  }, [post.id]);

  // Subscribe to comment likes
  useEffect(() => {
    const unsubscribers = comments.map(comment => {
      const commentLikesCol = collection(db, 'posts', post.id, 'comments', comment.id, 'likes');
      return onSnapshot(commentLikesCol, (snap) => {
        const uid = auth.currentUser?.uid;
        const userLiked = uid && snap.docs.some(d => d.id === uid);
        
        setCommentLikes(prev => ({
          ...prev,
          [comment.id]: snap.size,
          [`${comment.id}_liked`]: userLiked || false
        }));
      }, (err) => {
        console.error('Comment likes subscription error', err);
      });
    });
    return () => unsubscribers.forEach(unsub => unsub && unsub());
  }, [post.id, comments]);

  const toggleLike = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/uni-connect-login');
      return;
    }
    const likeDocRef = doc(db, 'posts', post.id, 'likes', user.uid);
    const postDocRef = doc(db, 'posts', post.id);
    
    try {
      await runTransaction(db, async (transaction) => {
        const likeSnap = await transaction.get(likeDocRef);
        const postSnap = await transaction.get(postDocRef);
        
        if (likeSnap.exists()) {
          transaction.delete(likeDocRef);
          transaction.update(postDocRef, {
            likesCount: Math.max(0, (postSnap.data()?.likesCount || 0) - 1)
          });
        } else {
          transaction.set(likeDocRef, { userId: user.uid, createdAt: serverTimestamp() });
          transaction.update(postDocRef, {
            likesCount: (postSnap.data()?.likesCount || 0) + 1
          });

          // Send notification to post author (only on like, not unlike)
          if (post.authorId && post.authorId !== user.uid) {
            try {
              await notifyPostLiked(post.authorId, {
                postId: post.id,
                postTitle: post.title,
                likerId: user.uid,
                likerName: user.displayName || user.email?.split('@')[0] || 'Someone',
                likerAvatar: null,
              });
            } catch (notifErr) {
              console.warn('Failed to send like notification:', notifErr);
            }
          }
        }
      });
    } catch (err) {
      console.error('Like toggle failed', err);
    }
  };

  const toggleCommentLike = async (postId, commentId) => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/uni-connect-login');
      return;
    }
    const commentLikeDocRef = doc(db, 'posts', postId, 'comments', commentId, 'likes', user.uid);
    const commentDocRef = doc(db, 'posts', postId, 'comments', commentId);
    
    try {
      await runTransaction(db, async (transaction) => {
        const likeSnap = await transaction.get(commentLikeDocRef);
        const commentSnap = await transaction.get(commentDocRef);
        
        if (likeSnap.exists()) {
          transaction.delete(commentLikeDocRef);
          transaction.update(commentDocRef, {
            likesCount: Math.max(0, (commentSnap.data()?.likesCount || 0) - 1)
          });
        } else {
          transaction.set(commentLikeDocRef, { userId: user.uid, createdAt: serverTimestamp() });
          transaction.update(commentDocRef, {
            likesCount: (commentSnap.data()?.likesCount || 0) + 1
          });
        }
      });
    } catch (err) {
      console.error('Comment like toggle failed', err);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    const user = auth.currentUser;
    if (!user) {
      navigate('/uni-connect-login');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      const commentDocRef = doc(db, 'posts', postId, 'comments', commentId);
      await deleteDoc(commentDocRef);
      toast.success('Comment deleted', { duration: 2000 });
    } catch (err) {
      console.error('Failed to delete comment', err);
      toast.error('Failed to delete comment');
    }
  };

  const handleReplyComment = (name, commentId) => {
    const replyText = `@${name} `;
    setNewComment(replyText);
    // Focus the input field
    const inputField = document.querySelector(`[data-comment-input="${post.id}"]`);
    if (inputField) {
      inputField.focus();
      inputField.setSelectionRange(replyText.length, replyText.length);
    }
  };

  const handlePostComment = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      navigate('/uni-connect-login');
      return;
    }
    if (!newComment.trim()) {
      return;
    }
    
    setPosting(true);
    try {
      const commentsCol = collection(db, 'posts', post.id, 'comments');
      const commentDocRef = doc(commentsCol);
      
      // Fetch user's avatar and gender from Firestore
      let commenterAvatar = '/default_avatar.png';
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          commenterAvatar = userData.avatarUrl || getDefaultAvatar(userData.gender || 'male');
        }
      } catch (err) {
        console.warn('Could not fetch commenter avatar:', err);
      }
      
      await setDoc(commentDocRef, {
        text: newComment,
        authorId: user.uid,
        authorName: user.displayName || user.email,
        authorAvatar: commenterAvatar,
        createdAt: serverTimestamp(),
        likesCount: 0
      });
      
      // Send notification to post author (only if not author commenting on their own post)
      if (post.authorId && post.authorId !== user.uid) {
        try {
          await notifyPostCommented(post.authorId, {
            postId: post.id,
            postTitle: post.title,
            commentId: commentDocRef.id,
            commenterId: user.uid,
            commenterName: user.displayName || user.email?.split('@')[0] || 'Someone',
            commenterAvatar: user.photoURL || null,
            commentText: newComment,
          });
        } catch (notifErr) {
          console.warn('Failed to send comment notification:', notifErr);
        }
      }
      
      setNewComment('');
    } catch (err) {
      console.error('Failed to post comment', err);
    } finally {
      setPosting(false);
    }
  };

  const handleSharePost = async () => {
    const shareUrl = `${window.location.origin}/campus-feed`;
    const shareText = `Check out this post: "${post.title}" on UniSpace!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'UniSpace Post',
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed', err);
        }
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!');
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }
    const toastId = toast.loading('Deleting post...');
    try {
      // Delete all comments and their likes first
      const commentsCol = collection(db, 'posts', post.id, 'comments');
      const commentsSnap = await getDocs(commentsCol);
      
      for (const commentDoc of commentsSnap.docs) {
        // Delete likes for each comment
        const commentLikesCol = collection(db, 'posts', post.id, 'comments', commentDoc.id, 'likes');
        const likesSnap = await getDocs(commentLikesCol);
        for (const likeDoc of likesSnap.docs) {
          await deleteDoc(likeDoc.ref);
        }
        // Delete the comment itself
        await deleteDoc(commentDoc.ref);
      }
      
      // Delete all likes on the post
      const likesCol = collection(db, 'posts', post.id, 'likes');
      const likesSnap = await getDocs(likesCol);
      for (const likeDoc of likesSnap.docs) {
        await deleteDoc(likeDoc.ref);
      }
      
      // Finally, delete the post
      await deleteDoc(doc(db, 'posts', post.id));
      setMenuOpen(false);
      toast.success('Post deleted successfully', { id: toastId });
    } catch (err) {
      console.error('Failed to delete post', err);
      toast.error('Failed to delete post', { id: toastId });
    }
  };

  const handleEditPost = () => {
    navigate(`/edit-post/${post.id}`);
    setMenuOpen(false);
  };

  return (
    <article id={`post-${post.id}`} className="bg-white dark:bg-secondary rounded-xl shadow-md p-4 sm:p-6">
      {/* Profile and author info in top row */}
      <div className="flex items-start gap-3 mb-4">
        {/* Profile picture */}
        <button onClick={() => navigate(`/profile/${post.authorId}`)} className="shrink-0">
          <img 
            alt={`${post.authorName}'s profile`} 
            className="w-12 h-12 rounded-full object-cover cursor-pointer" 
            src={authorAvatar || getDefaultAvatar('male')}
            onError={(e) => {
              e.target.src = getDefaultAvatar('male');
            }}
          />
        </button>
        
        {/* Author info and menu */}
        <div className="flex-grow flex items-start justify-between">
          <div className="flex flex-col">
            <p className="text-sm sm:text-base font-bold text-secondary dark:text-white cursor-pointer" onClick={() => navigate(`/profile/${post.authorId}`)}>{post.authorName || 'Anonymous'}</p>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : ''}</p>
          </div>
          {isAuthor && (
            <div className="relative">
              <button 
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 p-1"
              >
                <span className="material-symbols-outlined">more_horiz</span>
              </button>
              
              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 top-8 bg-white dark:bg-slate-800 shadow-lg rounded-lg z-50 min-w-[150px] border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handleEditPost}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2 border-b border-slate-200 dark:border-slate-700"
                  >
                    <span className="material-symbols-outlined text-base">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={handleDeletePost}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Title and content below - full width */}
      <div className="text-slate-700 dark:text-slate-300 space-y-2 sm:space-y-3">
        <h2 className="text-lg sm:text-xl font-bold text-secondary dark:text-white">{post.title}</h2>
        <div className="prose prose-sm sm:prose max-w-none dark:prose-invert text-sm sm:text-base">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
        </div>
      </div>
      <PostStats likes={likesCount} comments={comments.length || 0} onToggleLike={toggleLike} liked={liked} onToggleComments={() => setShowComments(!showComments)} onShare={handleSharePost} />
      
      {/* Comments Section */}
      {showComments && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-bold text-secondary dark:text-white mb-4">Comments ({comments.length})</h3>
          
          {/* Add Comment Input */}
          <form onSubmit={handlePostComment} className="flex items-start gap-3 mb-6">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 shrink-0"
              style={{
                backgroundImage: `url("${auth.currentUser?.photoURL || '/default_avatar.png'}")`,
              }}
            ></div>
            <div className="relative flex-grow">
              <textarea
                data-comment-input={post.id}
                className="form-textarea w-full rounded-lg bg-background-light dark:bg-slate-800 border border-slate-300 dark:border-slate-600 focus:ring-primary focus:border-primary text-secondary dark:text-white placeholder:text-slate-500"
                placeholder="Add a comment..."
                rows="2"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              ></textarea>
              <button 
                type="submit" 
                disabled={posting || !newComment.trim()}
                className="absolute bottom-2 right-2 flex items-center justify-center h-8 px-3 text-sm font-bold text-white bg-primary rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </form>

          {/* Comments List */}
          {commentsLoading ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-center py-4 text-slate-500 dark:text-slate-400">No comments yet. Be the first to comment!</div>
          ) : (
            <div className="space-y-5">
              {comments.map((comment) => (
                <Comment
                  key={comment.id}
                  img={comment.authorAvatar}
                  name={comment.authorName || 'Anonymous'}
                  isAuthor={comment.authorId === post.authorId}
                  time={comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleString() : ''}
                  text={comment.text}
                  likes={commentLikes[comment.id] || 0}
                  commentId={comment.id}
                  postId={post.id}
                  userId={comment.authorId}
                  onToggleLike={toggleCommentLike}
                  liked={commentLikes[`${comment.id}_liked`] || false}
                  onAvatarClick={() => navigate(`/profile/${comment.authorId}`)}
                  onDelete={handleDeleteComment}
                  onReply={handleReplyComment}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}



