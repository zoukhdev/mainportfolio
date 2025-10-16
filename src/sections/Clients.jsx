import { useEffect, useState, useRef } from 'react';
import { clientReviews } from '../constants/index.js';
import { supabase } from '../lib/supabaseClient.js';

const Clients = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);

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

  // Calculate how many groups of 3 we have
  const totalGroups = Math.ceil(reviews.length / 3);
  const currentGroup = Math.floor(currentIndex / 3);


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
        <div className="mt-12">
          {/* Testimonials Container - 3 per view with touch/drag */}
          <div 
            ref={scrollContainerRef}
            className="testimonials-container"
            style={{ 
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              overflowY: 'hidden',
              width: '100%',
              maxWidth: '1200px',
              margin: '0 auto',
              paddingBottom: '16px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              touchAction: 'pan-x',
              justifyContent: 'center'
            }}
            onWheel={(e) => {
              e.preventDefault();
              const scrollAmount = e.deltaY > 0 ? 1 : -1;
              const newIndex = Math.max(0, Math.min(reviews.length - 3, currentIndex + scrollAmount * 3));
              setCurrentIndex(newIndex);
            }}
            onTouchStart={(e) => {
              const touch = e.touches[0];
              e.currentTarget.dataset.startX = touch.clientX.toString();
              e.currentTarget.dataset.startY = touch.clientY.toString();
              e.currentTarget.dataset.startIndex = currentIndex.toString();
              e.currentTarget.dataset.isDragging = 'true';
            }}
            onTouchMove={(e) => {
              if (e.currentTarget.dataset.isDragging === 'true') {
                const touch = e.touches[0];
                const startX = parseFloat(e.currentTarget.dataset.startX || '0');
                const startY = parseFloat(e.currentTarget.dataset.startY || '0');
                const startIndex = parseFloat(e.currentTarget.dataset.startIndex || '0');
                
                const deltaX = startX - touch.clientX;
                const deltaY = startY - touch.clientY;
                
                // Only trigger if horizontal movement is significant and greater than vertical
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  const direction = deltaX > 0 ? 1 : -1;
                  const newIndex = Math.max(0, Math.min(reviews.length - 3, startIndex + direction * 3));
                  
                  if (newIndex !== currentIndex) {
                    setCurrentIndex(newIndex);
                    e.currentTarget.dataset.startIndex = newIndex.toString();
                    e.currentTarget.dataset.startX = touch.clientX.toString();
                  }
                }
              }
            }}
            onTouchEnd={(e) => {
              delete e.currentTarget.dataset.startX;
              delete e.currentTarget.dataset.startY;
              delete e.currentTarget.dataset.startIndex;
              delete e.currentTarget.dataset.isDragging;
            }}
          >
            {/* Show 3 testimonials at a time */}
            {reviews.slice(currentIndex, currentIndex + 3).map((item, index) => (
              <div 
                key={`review-${item.id}`} 
                style={{ 
                  flexShrink: 0,
                  width: '350px',
                  minWidth: '350px',
                  maxWidth: '350px',
                  borderRadius: '8px',
                  padding: '24px',
                  backgroundColor: 'rgba(0, 0, 0, 0.3)',
                  backdropFilter: 'blur(10px)',
                  boxSizing: 'border-box'
                }}
              >
                <div>
                  <p style={{ 
                    color: '#BEC1CF', 
                    fontWeight: '300', 
                    marginBottom: '24px', 
                    fontSize: '14px', 
                    lineHeight: '1.6',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    whiteSpace: 'normal',
                    hyphens: 'auto'
                  }}>
                    {item.review}
                  </p>

                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <p style={{ 
                        fontWeight: '600', 
                        color: '#BEC1CF', 
                        fontSize: '14px',
                        margin: 0,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}>
                        {item.name}
                      </p>
                      <p style={{ 
                        color: '#8B8B8B', 
                        fontSize: '12px', 
                        fontWeight: '300',
                        margin: 0,
                        wordWrap: 'break-word',
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal'
                      }}>
                        {item.position}
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {Array.from({ length: 5 }).map((_, starIndex) => {
                        const filled = starIndex < (item.rating ?? 5);
                        return (
                          <img
                            key={starIndex}
                            src="/assets/star.png"
                            alt="star"
                            style={{
                              width: '16px',
                              height: '16px',
                              opacity: filled ? 1 : 0.3
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Arrow Pagination Controls */}
          {reviews.length > 3 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              marginTop: '32px',
              gap: '16px'
            }}>
              {/* Left Arrow */}
              <button
                onClick={() => {
                  const newIndex = Math.max(0, currentIndex - 3);
                  setCurrentIndex(newIndex);
                }}
                disabled={currentIndex === 0}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: currentIndex === 0 ? 'rgba(139, 139, 139, 0.1)' : 'rgba(190, 193, 207, 0.3)',
                  border: 'none',
                  cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  opacity: currentIndex === 0 ? 0.3 : 0.7
                }}
                onMouseEnter={(e) => {
                  if (currentIndex > 0) {
                    e.target.style.backgroundColor = 'rgba(190, 193, 207, 0.5)';
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentIndex > 0) {
                    e.target.style.backgroundColor = 'rgba(190, 193, 207, 0.3)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.opacity = '0.7';
                  }
                }}
              >
                <img 
                  src="/assets/left-arrow.png" 
                  alt="Previous"
                  style={{
                    width: '14px',
                    height: '14px',
                    filter: 'invert(1)',
                    opacity: 0.8
                  }}
                />
              </button>

              {/* Page Indicator */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#BEC1CF',
                fontSize: '14px',
                fontWeight: '500'
              }}>
                <span>{currentGroup + 1}</span>
                <span style={{ opacity: 0.5 }}>/</span>
                <span style={{ opacity: 0.7 }}>{totalGroups}</span>
              </div>

              {/* Right Arrow */}
              <button
                onClick={() => {
                  const newIndex = Math.min(reviews.length - 3, currentIndex + 3);
                  setCurrentIndex(newIndex);
                }}
                disabled={currentIndex >= reviews.length - 3}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: currentIndex >= reviews.length - 3 ? 'rgba(139, 139, 139, 0.1)' : 'rgba(190, 193, 207, 0.3)',
                  border: 'none',
                  cursor: currentIndex >= reviews.length - 3 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  opacity: currentIndex >= reviews.length - 3 ? 0.3 : 0.7
                }}
                onMouseEnter={(e) => {
                  if (currentIndex < reviews.length - 3) {
                    e.target.style.backgroundColor = 'rgba(190, 193, 207, 0.5)';
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.opacity = '1';
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentIndex < reviews.length - 3) {
                    e.target.style.backgroundColor = 'rgba(190, 193, 207, 0.3)';
                    e.target.style.transform = 'scale(1)';
                    e.target.style.opacity = '0.7';
                  }
                }}
              >
                <img 
                  src="/assets/right-arrow.png" 
                  alt="Next"
                  style={{
                    width: '14px',
                    height: '14px',
                    filter: 'invert(1)',
                    opacity: 0.8
                  }}
                />
              </button>
            </div>
          )}
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
