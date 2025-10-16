import { useEffect, useState } from 'react';
import { clientReviews } from '../constants/index.js';
import { supabase } from '../lib/supabaseClient.js';

const Clients = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    review: '',
    rating: 5,
  });

  const handleStarClick = (value) => {
    setFormData((prev) => ({ ...prev, rating: value }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Load testimonials from Supabase
  const loadTestimonials = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('approved', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading testimonials:', error);
        // Fallback to local testimonials if Supabase fails
        setReviews(clientReviews.map((r) => ({ ...r, rating: r.rating ?? 5 })));
      } else {
        const mappedReviews = data.map((review) => ({
          id: review.id,
          name: review.name,
          position: review.position || 'Client',
          review: review.review,
          rating: review.rating || 5,
        }));
        setReviews(mappedReviews);
      }
    } catch (error) {
      console.error('Error loading testimonials:', error);
      // Fallback to local testimonials
      setReviews(clientReviews.map((r) => ({ ...r, rating: r.rating ?? 5 })));
    }
    setLoading(false);
  };

  // Set up real-time subscription
  useEffect(() => {
    loadTestimonials();

    const channel = supabase
      .channel('testimonials-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'testimonials' },
        (payload) => {
          const newReview = payload.new;
          if (newReview.approved) {
            setReviews((currentReviews) => [
              {
                id: newReview.id,
                name: newReview.name,
                position: newReview.position || 'Client',
                review: newReview.review,
                rating: newReview.rating || 5,
              },
              ...currentReviews,
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.review.trim()) return;

    try {
      const { data, error } = await supabase
        .from('testimonials')
        .insert({
          name: formData.name.trim(),
          position: formData.position.trim() || 'Client',
          review: formData.review.trim(),
          rating: formData.rating,
          approved: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting testimonial:', error);
        alert('Failed to submit testimonial. Please try again.');
      } else {
        // Clear form on successful submission
        setFormData({ name: '', position: '', review: '', rating: 5 });
        // The real-time subscription will handle adding the new review to the list
      }
    } catch (error) {
      console.error('Error submitting testimonial:', error);
      alert('Failed to submit testimonial. Please try again.');
    }
  };

  return (
    <section className="c-space my-20">
      <h3 className="head-text">Hear from My Clients</h3>

      {loading ? (
        <div className="text-white-600 mt-6">Loading testimonials...</div>
      ) : (
        <div className="client-container">
          {reviews.map((item) => (
          <div key={`review-${item.id}`} className="client-review">
            <div>
              <p className="text-white-800 font-light">{item.review}</p>

              <div className="client-content">
                <div className="flex gap-3">
                  <div className="flex flex-col">
                    <p className="font-semibold text-white-800">{item.name}</p>
                    <p className="text-white-500 md:text-base text-sm font-light">{item.position}</p>
                  </div>
                </div>

                <div className="flex self-end items-center gap-2">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const filled = index < (item.rating ?? 5);
                    return (
                      <img
                        key={index}
                        src="/assets/star.png"
                        alt="star"
                        className={`w-5 h-5 ${filled ? '' : 'opacity-30'}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          ))}
        </div>
      )}

      <div className="mt-10 border border-black-300 bg-black-200 rounded-lg p-5">
        <h4 className="text-white text-xl font-semibold mb-4">Add your review</h4>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your name"
              className="w-full bg-black-300 text-white rounded-md px-4 py-3 outline-none placeholder:text-white-500"
              required
            />
            <input
              type="text"
              name="position"
              value={formData.position}
              onChange={handleChange}
              placeholder="Your role/company (optional)"
              className="w-full bg-black-300 text-white rounded-md px-4 py-3 outline-none placeholder:text-white-500"
            />
          </div>

          <textarea
            name="review"
            value={formData.review}
            onChange={handleChange}
            placeholder="Share your experience..."
            rows={4}
            className="w-full bg-black-300 text-white rounded-md px-4 py-3 outline-none placeholder:text-white-500"
            required
          />

          <div className="flex items-center gap-3">
            <span className="text-white-600">Your rating:</span>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const value = index + 1;
                const filled = value <= formData.rating;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleStarClick(value)}
                    aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    className="focus:outline-none"
                  >
                    <img
                      src="/assets/star.png"
                      alt={filled ? 'filled star' : 'empty star'}
                      className={`w-6 h-6 ${filled ? '' : 'opacity-30'}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex">
            <button type="submit" className="btn">
              Submit Review
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default Clients;
