'use client';

import { useState } from 'react';
import Image from 'next/image';
import { WPComment } from '@/lib/wordpress';
import { postCommentAction } from '@/lib/actions';
import styles from './Comments.module.css';
import { User, MessageSquare, Send } from 'lucide-react';

interface CommentsProps {
    postId: number;
    comments: WPComment[];
}

export default function Comments({ postId, comments: initialComments }: CommentsProps) {
    const [comments, setComments] = useState<WPComment[]>(initialComments || []);
    const [author, setAuthor] = useState('');
    const [email, setEmail] = useState('');
    const [content, setContent] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const res = await postCommentAction(postId, content, author, email);
            if (res.success) {
                // If comment is returned (approved), add it. Otherwise it's pending.
                if (res.comment) {
                    // Check if it's approved (property might be missing in type but exists in graphQL)
                    // For now, if we get it back, we show it or just show success msg
                    const returnedComment = res.comment as WPComment & { approved?: boolean };
                    if (returnedComment.approved) {
                        setComments([...comments, returnedComment]);
                    }
                }
                setSuccess('Your comment has been submitted and is awaiting moderation.');
                setContent('');
            } else {
                setError(res.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className={styles.commentsSection}>
            <h3 className={styles.heading}>
                <MessageSquare size={24} />
                {comments.length} Comments
            </h3>

            <div className={styles.commentsList}>
                {comments.length === 0 ? (
                    <p className={styles.noComments}>No comments yet. Be the first to share your thoughts!</p>
                ) : (
                    comments.map(comment => (
                        <div key={comment.id} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <div className={styles.avatar}>
                                    {comment.author?.node?.avatar?.url ? (
                                        <Image
                                            src={comment.author.node.avatar.url}
                                            alt={comment.author.node.name}
                                            width={40}
                                            height={40}
                                        />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className={styles.meta}>
                                    <span className={styles.authorName}>{comment.author?.node?.name || 'Anonymous'}</span>
                                    <span className={styles.date}>{comment.date ? new Date(comment.date).toLocaleDateString() : ''}</span>
                                </div>
                            </div>
                            <div className={styles.commentContent} dangerouslySetInnerHTML={{ __html: comment.content }} />
                        </div>
                    ))
                )}
            </div>

            <form onSubmit={handleSubmit} className={styles.commentForm}>
                <h4 className={styles.formTitle}>Leave a Comment</h4>
                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <div className={styles.formRow}>
                    <input
                        type="text"
                        placeholder="Name"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        required
                        className={styles.input}
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className={styles.input}
                    />
                </div>
                <textarea
                    placeholder="Write your comment here..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    required
                    className={styles.textarea}
                    rows={4}
                />
                <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
                    {isSubmitting ? 'Posting...' : 'Post Comment'}
                    <Send size={16} />
                </button>
            </form>
        </div>
    );
}
