import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Contact() {
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase.from('contact_messages').insert({
  name: formData.full_name,
  email: formData.email,
  message: formData.subject ? formData.subject + ' - ' + formData.message : formData.message,
  status: 'Unread'
});
if (error) throw error;
if (!error) {
  
        setIsSubmitted(true);
        setFormData({
          full_name: '',
          email: '',
          subject: '',
          message: ''
        });
      } else {
        setError('Failed to send message. Please try again later.');
      }
    } catch {
      setError('An error occurred. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
   <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
 <div className="text-center mb-8">
  <h1 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 text-center">Contact Us</h1>
  <p className="text-slate-600 mt-3 max-w-2xl mx-auto text-center leading-relaxed">Have questions or suggestions? We'd love to hear from you. Reach out to the Sangguniang Bayan Secretariat.</p>
</div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact Information */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-2xl font-serif font-bold text-lgu-blue-900 mb-6">Get in Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start">
                <div className="bg-lgu-blue-50 p-3 rounded-lg mr-4 text-lgu-blue-900">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1">Office Address</h3>
                  <p className="text-slate-600 leading-relaxed">
                    COME AND VISIT US AT<br />
                    2ND FLOOR LEGISLATIVE BUILDING<br />
                    UBAY MUNICIPAL HALL<br />
                    UBAY, BOHOL
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-lgu-blue-50 p-3 rounded-lg mr-4 text-lgu-blue-900">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1"></h3>
                  <p className="text-slate-600"></p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-lgu-blue-50 p-3 rounded-lg mr-4 text-lgu-blue-900">
                  <Mail className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1">Email Address</h3>
                  <p className="text-slate-600">sanggunianbayanubay@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="bg-lgu-blue-50 p-3 rounded-lg mr-4 text-lgu-blue-900">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 uppercase text-xs tracking-wider mb-1">Office Hours</h3>
                  <p className="text-slate-600">Monday - Friday: 8:00 AM - 5:00 PM</p>
                </div>
              </div>
            </div>
          </div>

          {/* Embedded Map */}
          <div className="bg-slate-200 rounded-2xl h-80 flex items-center justify-center overflow-hidden relative border border-slate-200 shadow-sm">
            <iframe 
              src="https://maps.google.com/maps?q=Sangguniang+Bayan+Session+Hall,+Ubay+Municipal+Hall,+Poblacion,+Ubay,+Bohol&t=&z=16&ie=UTF8&iwloc=&output=embed"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="UBAY Municipal Hall Map"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-2xl font-serif font-bold text-lgu-blue-900 mb-6">Send us a Message</h2>
          
          {isSubmitted ? (
            <div className="bg-green-50 border border-green-100 p-8 rounded-xl text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">Message Sent!</h3>
              <p className="text-green-700 mb-6">Thank you for reaching out. We will get back to you as soon as possible.</p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="text-lgu-blue-900 font-bold hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900" 
                    placeholder="Juan Dela Cruz"
                    value={formData.full_name}
                    onChange={e => setFormData({...formData, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900" 
                    placeholder="juan@example.com"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900" 
                  placeholder="Inquiry about Ordinance No. 123"
                  value={formData.subject}
                  onChange={e => setFormData({...formData, subject: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                <textarea 
                  rows={6} 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:border-lgu-blue-900 resize-none" 
                  placeholder="How can we help you?"
                  value={formData.message}
                  onChange={e => setFormData({...formData, message: e.target.value})}
                  required
                ></textarea>
              </div>
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-lgu-blue-900 text-white font-bold py-3 rounded-lg hover:bg-lgu-blue-800 transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Send className="w-5 h-5 mr-2" />
                )}
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
