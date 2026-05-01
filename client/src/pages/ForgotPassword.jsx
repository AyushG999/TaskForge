import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter token + new password
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!email) { toast.error('Please enter your email'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      // in dev mode, the token is returned directly
      if (res.data.resetToken) {
        setResetToken(res.data.resetToken);
      }
      toast.success('Reset link generated!');
      setStep(2);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken.trim()) { toast.error('Reset token is required'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token: resetToken, newPassword });
      toast.success('Password reset successful!');
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo" style={{ background: '#10b981' }}>
              <ShieldCheck size={24} color="white" />
            </div>
            <h1>Password Reset!</h1>
            <p>Your password has been changed successfully. You can now sign in with your new password.</p>
          </div>
          <Link to="/login" className="btn btn-primary btn-full">
            <ArrowLeft size={18} />Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <KeyRound size={24} color="white" />
          </div>
          <h1>{step === 1 ? 'Forgot Password?' : 'Reset Password'}</h1>
          <p>{step === 1 ? 'Enter your email and we\'ll help you reset it' : 'Enter the reset token and your new password'}</p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequestReset} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <span className="btn-loading">Sending...</span>
              ) : (
                <><Mail size={18} />Send Reset Link</>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="form-group">
              <label htmlFor="resetToken">Reset Token</label>
              <input
                id="resetToken"
                type="text"
                value={resetToken}
                onChange={(e) => setResetToken(e.target.value)}
                placeholder="Paste your reset token here"
                style={{ fontFamily: 'monospace', fontSize: '12px' }}
              />
              <small className="text-muted" style={{ fontSize: '11px', marginTop: '4px', display: 'block' }}>
                The token was auto-filled from the server response
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                autoComplete="new-password"
              />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? (
                <span className="btn-loading">Resetting...</span>
              ) : (
                <><ShieldCheck size={18} />Reset Password</>
              )}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login"><ArrowLeft size={14} style={{ verticalAlign: 'middle' }} /> Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
