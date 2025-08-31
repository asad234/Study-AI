"use client"
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  Globe, 
  Mail,
  Calendar,
  FileText,
  ChevronRight,
  Check,
  AlertTriangle
} from 'lucide-react';

interface PrivacySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string[];
}

const privacySections: PrivacySection[] = [
  {
    id: 'information-collection',
    title: 'Information We Collect',
    icon: <Eye className="w-5 h-5" />,
    content: [
      'Account information (name, email, password) when you register',
      'Study data including exam results, progress tracking, and performance analytics',
      'Usage data such as features used, time spent, and interaction patterns',
      'Technical information including device type, browser, IP address, and operating system',
      'Communication data when you contact our support team',
      'Payment information processed securely through our payment providers'
    ]
  },
  {
    id: 'how-we-use',
    title: 'How We Use Your Information',
    icon: <FileText className="w-5 h-5" />,
    content: [
      'Provide and improve our Study-AI services and features',
      'Personalize your learning experience with AI-powered recommendations',
      'Track your progress and generate performance analytics',
      'Communicate with you about updates, features, and support',
      'Process payments and manage your subscription',
      'Ensure security and prevent fraud or abuse',
      'Comply with legal obligations and protect our rights'
    ]
  },
  {
    id: 'data-sharing',
    title: 'Information Sharing',
    icon: <Users className="w-5 h-5" />,
    content: [
      'We do not sell your personal information to third parties',
      'Service providers who help us operate Study-AI (hosting, analytics, payment processing)',
      'Legal authorities when required by law or to protect rights and safety',
      'Business partners only with your explicit consent for specific integrations',
      'Anonymized, aggregated data for research and improvement purposes',
      'Other users only when you explicitly share content (public study groups, shared exams)'
    ]
  },
  {
    id: 'data-security',
    title: 'Data Security',
    icon: <Lock className="w-5 h-5" />,
    content: [
      'Industry-standard encryption for data in transit and at rest',
      'Regular security audits and vulnerability assessments',
      'Access controls limiting who can view your information',
      'Secure data centers with physical and digital protection measures',
      'Regular backups to prevent data loss',
      'Incident response procedures for any security events',
      'Employee training on privacy and security best practices'
    ]
  },
  {
    id: 'your-rights',
    title: 'Your Privacy Rights',
    icon: <Shield className="w-5 h-5" />,
    content: [
      'Access: Request a copy of your personal information',
      'Correction: Update or correct inaccurate information',
      'Deletion: Request deletion of your account and data',
      'Portability: Export your data in a standard format',
      'Restriction: Limit how we process your information',
      'Objection: Opt out of certain data processing activities',
      'Withdrawal: Remove consent for data processing at any time'
    ]
  },
  {
    id: 'cookies',
    title: 'Cookies and Tracking',
    icon: <Globe className="w-5 h-5" />,
    content: [
      'Essential cookies for basic functionality and security',
      'Analytics cookies to understand how you use our service',
      'Preference cookies to remember your settings and choices',
      'Marketing cookies for personalized content and ads (with consent)',
      'You can control cookie preferences through your browser settings',
      'Some features may not work properly if cookies are disabled'
    ]
  }
];

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState<string>('information-collection');

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-950 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Your privacy is important to us. This policy explains how Study-AI collects, uses, and protects your information.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Last updated: March 15, 2024
            </Badge>
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
              GDPR Compliant
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg">Quick Navigation</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {privacySections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left px-4 py-3 rounded-none hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3 ${
                        activeSection === section.id 
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-500' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {section.icon}
                      <span className="text-sm">{section.title}</span>
                      <ChevronRight className="w-3 h-3 ml-auto" />
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>

            {/* Contact Card */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Privacy Questions?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  If you have questions about this policy, contact our Privacy Officer:
                </p>
                <Button variant="outline" className="w-full">
                  <Mail className="w-4 h-4 mr-2" />
                  privacy@study-ai.com
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Key Highlights */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Key Points:</strong> We don&apos;t sell your data, we use encryption to protect your information, 
                and you have full control over your privacy settings. You can delete your account and data at any time.
              </AlertDescription>
            </Alert>

            {/* Privacy Sections */}
            {privacySections.map((section) => (
              <Card key={section.id} id={section.id} className="scroll-mt-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                      {section.icon}
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {section.content.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}

            {/* Data Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  Data Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Active Accounts</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        We keep your data as long as your account is active and for legitimate business purposes.
                      </p>
                    </div>
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg">
                      <h4 className="font-semibold mb-2">Deleted Accounts</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Most data is deleted within 30 days. Some may be retained longer for legal compliance.
                      </p>
                    </div>
                  </div>
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Backup copies may persist for up to 90 days in our secure backup systems for disaster recovery purposes.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>

            {/* International Transfers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/50 rounded-lg flex items-center justify-center">
                    <Globe className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  International Data Transfers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    Study-AI may transfer your data internationally to provide our services. We ensure appropriate safeguards:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Standard Contractual Clauses (SCCs) with data processors</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Adequacy decisions for transfers to approved countries</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Regular assessments of data protection levels</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Children's Privacy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 dark:bg-pink-900/50 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-pink-600 dark:text-pink-400" />
                  </div>
                  Children&apos;s Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Study-AI is intended for users 13 years and older. We do not knowingly collect information from children under 13.
                    </AlertDescription>
                  </Alert>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Ages 13-17</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Parental consent may be required. Limited data collection with enhanced protections.
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Under 13</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        If discovered, we will immediately delete the account and all associated data.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Changes to Policy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  Changes to This Policy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-gray-700 dark:text-gray-300">
                    We may update this Privacy Policy from time to time. When we do:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">We&apos;ll notify you via email and in-app notifications</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">The updated date will be shown at the top of this policy</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 dark:text-gray-300">Significant changes will require your consent to continue using our services</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <Card className="border-2 border-blue-200 dark:border-blue-800">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  Contact Us About Privacy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Privacy Officer</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        privacy@study-ai.com
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        Response time: Within 72 hours
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm">
                      <Shield className="w-4 h-4 mr-2" />
                      Data Protection Rights
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileText className="w-4 h-4 mr-2" />
                      Download My Data
                    </Button>
                    <Button variant="outline" size="sm">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Report Privacy Concern
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}