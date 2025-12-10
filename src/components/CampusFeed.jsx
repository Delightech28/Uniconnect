import React, { useEffect, useState } from 'react';
import AppHeader from './AppHeader';
import { useTheme } from '../hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const PostStats = ({ likes, comments, onToggleLike, liked }) => (
  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-slate-600 dark:text-slate-400">
    <div className="flex items-center gap-4">
      <button onClick={onToggleLike} className={`flex items-center gap-1.5 ${liked ? 'text-primary' : 'hover:text-primary'} dark:hover:text-primary`}>
        <span className="material-symbols-outlined text-xl">thumb_up</span>
        <span className="text-sm font-medium">{likes}</span>
      </button>
      <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-primary">
        <span className="material-symbols-outlined text-xl">chat_bubble</span>
        <span className="text-sm font-medium">{comments}</span>
      </button>
    </div>
    <button className="flex items-center gap-1.5 hover:text-primary dark:hover:text-primary">
      <span className="material-symbols-outlined text-xl">share</span>
      <span className="text-sm font-medium">Share</span>
    </button>
  </div>
);

const Comment = ({ img, name, isAuthor, time, text, likes, commentId, postId, onToggleLike, liked }) => (
  <div className="flex items-start gap-3">
    <img
      alt={`${name}'s profile picture`}
      className={`${isAuthor ? 'w-8 h-8' : 'w-10 h-10'} rounded-full object-cover shrink-0`}
      src={img}
    />
    <div className="flex-grow">
      <div className={`${isAuthor ? 'bg-slate-200 dark:bg-slate-700/50' : 'bg-background-light dark:bg-slate-800'} rounded-lg p-3`}>
        <p className="font-semibold text-secondary dark:text-white text-sm">
          {name} {isAuthor && <span className="ml-1 text-xs font-normal text-primary">(Author)</span>}
        </p>
        <p className="text-slate-700 dark:text-slate-300 text-sm mt-1">{text}</p>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1.5 px-2">
        <button onClick={() => onToggleLike && onToggleLike(postId, commentId)} className={`hover:text-primary font-medium ${liked ? 'text-primary' : ''}`}>Like</button>
        <span>·</span>
        <button className="hover:text-primary font-medium">Reply</button>
        <span>·</span>
        <span>{time}</span>
        {likes && (
          <div className="flex items-center gap-1 ml-auto">
            <span className={`material-symbols-outlined text-base ${likes > 5 ? 'text-primary' : 'text-slate-400'}`}>thumb_up</span>
            <span>{likes}</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// --- Main App Component ---

export default function CampusFeed() {
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
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
  return (
    <div className="bg-background-light dark:bg-background-dark font-display">
      <div className="relative flex h-auto min-h-screen w-full flex-col group/design-root overflow-x-hidden">
        <div className="layout-container flex h-full grow flex-col">
          <AppHeader darkMode={darkMode} toggleDarkMode={toggleTheme} />

          <main className="flex-1 px-4 sm:px-10 py-8">
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
      </div>
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
    try {
      const snap = await getDoc(likeDocRef);
      if (snap.exists()) {
        await deleteDoc(likeDocRef);
      } else {
        await setDoc(likeDocRef, { userId: user.uid, createdAt: serverTimestamp() });
      }
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
    try {
      const snap = await getDoc(commentLikeDocRef);
      if (snap.exists()) {
        await deleteDoc(commentLikeDocRef);
      } else {
        await setDoc(commentLikeDocRef, { userId: user.uid, createdAt: serverTimestamp() });
      }
    } catch (err) {
      console.error('Comment like toggle failed', err);
    }
  };

  return (
    <article className="bg-white dark:bg-secondary rounded-xl shadow-md p-6">
      <div className="flex items-start gap-4">
        <img alt={`${post.authorName}'s profile`} className="w-12 h-12 rounded-full object-cover" src={post.authorAvatar || '/default_avatar.png'} />
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-secondary dark:text-white">{post.authorName || 'Anonymous'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{post.createdAt?.toDate ? new Date(post.createdAt.toDate()).toLocaleString() : ''}</p>
            </div>
            <button className="text-slate-500 dark:text-slate-400">
              <span className="material-symbols-outlined">more_horiz</span>
            </button>
          </div>
          <div className="mt-4 text-slate-700 dark:text-slate-300 space-y-3">
            <h2 className="text-xl font-bold text-secondary dark:text-white">{post.title}</h2>
            <div className="prose max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content || ''}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
      <PostStats likes={likesCount} comments={comments.length || 0} onToggleLike={toggleLike} liked={liked} />
      
      {/* Comments Section */}
      {!commentsLoading && comments.length > 0 && (
        <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 space-y-4">
          {comments.map((comment) => (
            <Comment
              key={comment.id}
              img={comment.authorAvatar || '/default_avatar.png'}
              name={comment.authorName || 'Anonymous'}
              isAuthor={comment.authorId === post.authorId}
              time={comment.createdAt?.toDate ? new Date(comment.createdAt.toDate()).toLocaleString() : ''}
              text={comment.text}
              likes={commentLikes[comment.id] || 0}
              commentId={comment.id}
              postId={post.id}
              onToggleLike={toggleCommentLike}
              liked={commentLikes[`${comment.id}_liked`] || false}
            />
          ))}
        </div>
      )}
    </article>
  );
}