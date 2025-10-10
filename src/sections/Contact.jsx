import emailjs from '@emailjs/browser';
import { useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

import useAlert from '../hooks/useAlert.js';
import Alert from '../components/Alert.jsx';

const Contact = () => {
  const formRef = useRef();
  const recaptchaRef = useRef();

  const { alert, showAlert, hideAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const [form, setForm] = useState({ name: '', email: '', message: '' });

  // Character limits
  const MAX_NAME_LENGTH = 50;
  const MAX_MESSAGE_LENGTH = 500;

  const handleChange = ({ target: { name, value } }) => {
    // Apply character limits
    if (name === 'name' && value.length > MAX_NAME_LENGTH) return;
    if (name === 'message' && value.length > MAX_MESSAGE_LENGTH) return;

    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const onRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (form.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Message validation
    if (!form.message.trim()) {
      newErrors.message = 'Message is required';
    } else if (form.message.trim().length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      showAlert({
        show: true,
        text: 'Please fix the errors in the form',
        type: 'danger',
      });
      return;
    }

    // Check reCAPTCHA (optional - comment out if you don't have a key yet)
    // if (!recaptchaToken) {
    //   showAlert({
    //     show: true,
    //     text: 'Please verify you are not a robot',
    //     type: 'danger',
    //   });
    //   return;
    // }

    setLoading(true);

    emailjs
      .send(
        import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          to_name: 'Oussama Zoukh',
          from_email: form.email,
          to_email: 'zco.deveolpment@gmail.com',
          message: form.message,
        },
        import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY,
      )
      .then(
        () => {
          setLoading(false);
          showAlert({
            show: true,
            text: 'Thank you for your message! I will get back to you soon 😃',
            type: 'success',
          });

          setTimeout(() => {
            hideAlert(false);
            setForm({
              name: '',
              email: '',
              message: '',
            });
            setErrors({});
            if (recaptchaRef.current) {
              recaptchaRef.current.reset();
              setRecaptchaToken(null);
            }
          }, 3000);
        },
        (error) => {
          setLoading(false);
          console.error(error);

          showAlert({
            show: true,
            text: "Failed to send message. Please try again or email me directly 😢",
            type: 'danger',
          });
        },
      );
  };

  return (
    <section className="c-space my-20" id="contact">
      {alert.show && <Alert {...alert} />}

      <div className="relative min-h-screen flex items-center justify-center flex-col">
        <img src="/assets/terminal.png" alt="terminal-bg" className="absolute inset-0 min-h-screen" />

        <div className="contact-container">
          <h3 className="head-text">Let's talk</h3>
          <p className="text-lg text-white-600 mt-3">
            Whether you're looking to build a new website, improve your existing platform, or bring a unique project to
            life, I'm here to help.
          </p>

          {/* Social Media Contact Options */}
          <div className="flex gap-4 mt-6 flex-wrap">
            <a 
              href="https://github.com/zoukhdev/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white-600 hover:text-white transition-colors">
              <img src="/assets/github.svg" alt="github" className="w-5 h-5" />
              <span className="text-sm">GitHub</span>
            </a>
            <a 
              href="https://www.instagram.com/zoukhdev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white-600 hover:text-white transition-colors">
              <img src="/assets/instagram.svg" alt="instagram" className="w-5 h-5" />
              <span className="text-sm">Instagram</span>
            </a>
            <a 
              href="mailto:zco.deveolpment@gmail.com"
              className="flex items-center gap-2 text-white-600 hover:text-white transition-colors">
              <span className="text-sm">📧 Email Me Directly</span>
            </a>
          </div>

          <form ref={formRef} onSubmit={handleSubmit} className="mt-12 flex flex-col space-y-7">
            <label className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="field-label">Full Name *</span>
                <span className="text-xs text-white-500">
                  {form.name.length}/{MAX_NAME_LENGTH}
                </span>
              </div>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className={`field-input ${errors.name ? 'border-2 border-red-500' : ''}`}
                placeholder="ex., John Doe"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </label>

            <label className="space-y-3">
              <span className="field-label">Email Address *</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={`field-input ${errors.email ? 'border-2 border-red-500' : ''}`}
                placeholder="ex., johndoe@gmail.com"
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
              )}
            </label>

            <label className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="field-label">Your Message *</span>
                <span className="text-xs text-white-500">
                  {form.message.length}/{MAX_MESSAGE_LENGTH}
                </span>
              </div>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                className={`field-input ${errors.message ? 'border-2 border-red-500' : ''}`}
                placeholder="Share your thoughts or inquiries... (minimum 10 characters)"
              />
              {errors.message && (
                <p className="text-red-500 text-sm mt-1">{errors.message}</p>
              )}
            </label>

            {/* reCAPTCHA - Uncomment when you get your site key */}
            {/* 
            <div className="flex justify-center">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                onChange={onRecaptchaChange}
                theme="dark"
              />
            </div>
            */}

            <button className="field-btn" type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Message'}

              <img src="/assets/arrow-up.png" alt="arrow-up" className="field-btn_arrow" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
