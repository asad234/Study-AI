"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  HelpCircle, 
  MessageCircle, 
  Mail, 
  Phone, 
  ChevronDown, 
  ChevronRight,
  Search,
  BookOpen,
  Settings,
  CreditCard,
  Shield,
  Zap,
  Users,
  Send
} from 'lucide-react';

interface FAQ {
  id: number;
  question: string;
  answer: string;
  category: string;
}

const faqs: FAQ[] = [
  {
    id: 1,
    question: "How do I create my first exam?",
    answer: "To create your first exam, navigate to the 'Create Exam' section in your dashboard. Click 'New Exam', select your subject, add questions with multiple choice answers, set the time limit, and save. Your exam will be ready to take or share!",
    category: "Getting Started"
  },
  {
    id: 2,
    question: "Can I import questions from a file?",
    answer: "Yes! Study-AI supports importing questions from CSV, Excel, and text files. Go to 'Import Questions' in the exam creation menu, select your file format, and follow the template provided to ensure proper formatting.",
    category: "Exam Creation"
  },
  {
    id: 3,
    question: "How does the AI study assistant work?",
    answer: "Our AI assistant analyzes your performance, identifies weak areas, and creates personalized study plans. It adapts to your learning style and provides targeted practice questions to help you improve in specific topics.",
    category: "AI Features"
  },
  {
    id: 4,
    question: "Is my study data secure and private?",
    answer: "Absolutely! We use enterprise-grade encryption to protect your data. Your study materials, progress, and personal information are stored securely and never shared with third parties without your explicit consent.",
    category: "Privacy & Security"
  },
  {
    id: 5,
    question: "Can I share exams with my classmates?",
    answer: "Yes! You can share exams via direct links, email invitations, or by creating study groups. Set permissions to control whether others can view results, edit questions, or just take the exam.",
    category: "Collaboration"
  },
  {
    id: 6,
    question: "What happens if I lose internet connection during an exam?",
    answer: "Study-AI automatically saves your progress locally. If you lose connection, your answers are preserved, and you can resume exactly where you left off once your connection is restored.",
    category: "Technical Issues"
  },
  {
    id: 7,
    question: "How do I upgrade my account?",
    answer: "Go to Settings > Billing to view available plans. Click 'Upgrade' on your preferred plan, enter payment details, and enjoy premium features instantly. You can downgrade or cancel anytime.",
    category: "Account & Billing"
  },
  {
    id: 8,
    question: "Can I use Study-AI offline?",
    answer: "Yes! Premium users can download exams for offline use. Your progress will sync automatically when you reconnect to the internet. Perfect for studying on the go!",
    category: "Features"
  }
];

const categories = Array.from(new Set(faqs.map(faq => faq.category)));

export default function HelpSupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formSubmitted, setFormSubmitted] = useState(false);

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFAQ = (id: number) => {
    setExpandedFAQ(expandedFAQ === id ? null : id);
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    // Reset form
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const handleInputChange = (field: string, value: string) => {
    setContactForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Help & Support</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Get the help you need to make the most of Study-AI. Browse our FAQ, contact support, or explore our resources.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <BookOpen className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">User Guide</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Step-by-step tutorials</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Quick Start</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Get started in minutes</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
                  <h3 className="font-semibold mb-1">Community</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Connect with users</p>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Frequently Asked Questions
                </CardTitle>
                <CardDescription>
                  Find answers to common questions about Study-AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search questions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={selectedCategory === 'All' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setSelectedCategory('All')}
                    >
                      All
                    </Badge>
                    {categories.map(category => (
                      <Badge
                        key={category}
                        variant={selectedCategory === category ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => setSelectedCategory(category)}
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* FAQ Items */}
                <div className="space-y-2">
                  {filteredFAQs.map(faq => (
                    <div
                      key={faq.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                    >
                      <button
                        className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
                        onClick={() => toggleFAQ(faq.id)}
                      >
                        <div className="flex items-center gap-3">
                          {expandedFAQ === faq.id ? (
                            <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                          <span className="font-medium">{faq.question}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {faq.category}
                        </Badge>
                      </button>
                      {expandedFAQ === faq.id && (
                        <div className="px-4 pb-4 pl-11 text-gray-600 dark:text-gray-400">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {filteredFAQs.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <HelpCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No matching questions found. Try adjusting your search or filter.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Support
                </CardTitle>
                <CardDescription>
                  Can&apos;t find what you&apos;re looking for? Send us a message and we&apos;ll get back to you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {formSubmitted ? (
                  <Alert className="mb-4">
                    <AlertDescription>
                      Thank you for your message! We&apos;ll get back to you within 24 hours.
                    </AlertDescription>
                  </Alert>
                ) : null}
                
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Name</label>
                      <Input
                        value={contactForm.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <Input
                        type="email"
                        value={contactForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Subject</label>
                    <Input
                      value={contactForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      placeholder="What can we help you with?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Message</label>
                    <Textarea
                      value={contactForm.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Describe your question or issue in detail..."
                      rows={5}
                      required
                    />
                  </div>
                  <Button onClick={handleContactSubmit} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Get in Touch</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">support@study-ai.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">Phone Support</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">+1 (555) 123-4567</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <strong>Support Hours:</strong><br />
                    Monday - Friday: 9AM - 6PM EST<br />
                    Weekend: 10AM - 4PM EST
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Popular Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Topics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                    <Settings className="w-4 h-4" />
                    Account Settings
                  </div>
                  <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                    <CreditCard className="w-4 h-4" />
                    Billing & Subscriptions
                  </div>
                  <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                    <Shield className="w-4 h-4" />
                    Privacy & Security
                  </div>
                  <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                    <BookOpen className="w-4 h-4" />
                    Creating Exams
                  </div>
                  <div className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                    <Zap className="w-4 h-4" />
                    AI Features
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-sm">All Systems</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                    Operational
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Last updated: 2 minutes ago
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}