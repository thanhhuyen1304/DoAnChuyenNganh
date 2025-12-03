// import React, { useState, useEffect } from 'react';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
// import { Button } from '../ui/button';
// import { Badge } from '../ui/badge';
// import { User, Trophy, Target, Clock, ArrowRight } from 'lucide-react';
// import { useLanguage } from '../contexts/LanguageContext';
// import { useNavigate } from 'react-router-dom';

// const decoImg = new URL('../images/2.jpg', import.meta.url).href;

// const Dashboard = () => {
//   const [user, setUser] = useState<any>(null);
//   const [isVisible, setIsVisible] = useState(false);
//   const { language } = useLanguage();
//   const navigate = useNavigate();

//   useEffect(() => {
//     const userData = localStorage.getItem('user');
//     if (userData) {
//       setUser(JSON.parse(userData));
//       setIsVisible(true);
//     } else {
//       // Redirect to login if not authenticated
//       window.location.href = '/login';
//     }
//   }, []);

//   if (!user) {
//     return <div className="min-h-screen bg-background flex items-center justify-center">Đang tải...</div>;
//   }

//   return (
//     <div className="min-h-screen">
//       {/* Background */}
//       <div
//         className="fixed inset-0 z-0 bg-cover bg-center opacity-40 dark:opacity-30 filter blur-sm"
//         style={{ backgroundImage: `url(${decoImg})` }}
//       />
//       <div className="absolute inset-0 pointer-events-none bg-white/30 dark:bg-black/30 z-10" />
      
//       {/* Header */}
//       <div className="relative z-20 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
//         <div className="container mx-auto px-4 py-6">
//           <div className="flex items-center justify-between">
//             <div className={`transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
//               <span className="inline-block py-1 px-3 mb-2 text-sm font-medium bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-full">
//                 {language === 'vi' ? 'Trang Cá Nhân' : 'Personal Dashboard'}
//               </span>
//               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
//                 {language === 'vi' ? 'Chào mừng trở lại' : 'Welcome back'},{' '}
//                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
//                   {user.username}!
//                 </span>
//               </h1>
//             </div>
//             <div className="flex items-center gap-4">
//               <Badge className="bg-gradient-to-r from-[#FF007A] to-[#A259FF] hover:from-primary-700 hover:to-primary-600" variant={user.role === 'admin' ? 'default' : 'secondary'}>
//                 {user.role === 'admin' ? 'Admin' : 'User'}
//               </Badge>
//               <Button 
//                 variant="outline"
//                 className="border-2 hover:border-primary-600 dark:hover:border-primary-400 group"
//                 onClick={() => window.location.href = '/'}
//               >
//                 <span>{language === 'vi' ? 'Về trang chủ' : 'Home'}</span>
//                 <ArrowRight size={18} className="ml-2 inline-block group-hover:translate-x-1 transition-transform" />
//               </Button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Main Content */}
//       <div className="container mx-auto px-4 py-8 relative z-20">
//         <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 transition-all duration-700 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
//           {/* User Stats */}
//           <Card className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Điểm kinh nghiệm' : 'Experience'}</CardTitle>
//               <User className="h-4 w-4 text-primary-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
//                 {user.experience || 0}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 Rank: {user.rank || 'Newbie'}
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Huy hiệu' : 'Badges'}</CardTitle>
//               <Trophy className="h-4 w-4 text-yellow-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
//                 {user.badges?.length || 0}
//               </div>
//               <p className="text-xs text-muted-foreground">
//                 {language === 'vi' ? 'Huy hiệu đã đạt được' : 'Badges earned'}
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Bài tập đã làm' : 'Challenges'}</CardTitle>
//               <Target className="h-4 w-4 text-green-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">0</div>
//               <p className="text-xs text-muted-foreground">
//                 {language === 'vi' ? 'Chưa có bài tập nào' : 'No challenges yet'}
//               </p>
//             </CardContent>
//           </Card>

//           <Card className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
//             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
//               <CardTitle className="text-sm font-medium">{language === 'vi' ? 'Thời gian học' : 'Learning Time'}</CardTitle>
//               <Clock className="h-4 w-4 text-blue-500" />
//             </CardHeader>
//             <CardContent>
//               <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">0h</div>
//               <p className="text-xs text-muted-foreground">
//                 {language === 'vi' ? 'Tổng thời gian luyện tập' : 'Total practice time'}
//               </p>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Quick Actions */}
//         <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-all duration-700 delay-150 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
//           <Card className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
//             <CardHeader>
//               <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
//                 {language === 'vi' ? 'Bắt đầu luyện tập' : 'Start Practice'}
//               </CardTitle>
//               <CardDescription className="text-gray-600 dark:text-gray-300">
//                 {language === 'vi' ? 'Chọn bài tập phù hợp với trình độ của bạn' : 'Choose challenges that match your skill level'}
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <Button 
//                   className="w-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] hover:from-primary-700 hover:to-primary-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
//                   onClick={() => navigate('/practice')}
//                 >
//                   {language === 'vi' ? 'Bắt đầu luyện tập' : 'Start Practice'}
//                 </Button>
//                 <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
//                   <p className="flex items-center">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] mr-2"></span>
//                     {language === 'vi' ? 'Bài tập từ dễ đến khó' : 'Challenges from easy to hard'}
//                   </p>
//                   <p className="flex items-center">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] mr-2"></span>
//                     {language === 'vi' ? 'Hỗ trợ nhiều ngôn ngữ lập trình' : 'Multiple programming languages supported'}
//                   </p>
//                   <p className="flex items-center">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] mr-2"></span>
//                     {language === 'vi' ? 'Phản hồi ngay lập tức' : 'Instant feedback'}
//                   </p>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <Card className="bg-white/80 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-100/20 dark:border-gray-700/50 hover:shadow-[0_0_25px_rgba(162,89,255,0.15)] transition-all duration-300 hover:scale-[1.02]">
//             <CardHeader>
//               <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#FF007A] to-[#A259FF]">
//                 {language === 'vi' ? 'Thông tin cá nhân' : 'Personal Info'}
//               </CardTitle>
//               <CardDescription className="text-gray-600 dark:text-gray-300">
//                 {language === 'vi' ? 'Quản lý hồ sơ và cài đặt tài khoản' : 'Manage your profile and account settings'}
//               </CardDescription>
//             </CardHeader>
//             <CardContent>
//               <div className="space-y-4">
//                 <div className="space-y-2 text-gray-600 dark:text-gray-300">
//                   <p className="flex items-center">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] mr-2"></span>
//                     <strong>Email:</strong> {user.email}
//                   </p>
//                   <p className="flex items-center">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] mr-2"></span>
//                     <strong>Username:</strong> {user.username}
//                   </p>
//                   <p className="flex items-center">
//                     <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#FF007A] to-[#A259FF] mr-2"></span>
//                     <strong>{language === 'vi' ? 'Ngôn ngữ yêu thích' : 'Favorite Languages'}:</strong>{' '}
//                     {user.favoriteLanguages?.join(', ') || (language === 'vi' ? 'Chưa chọn' : 'Not selected')}
//                   </p>
//                 </div>
//                 <Button 
//                   variant="outline" 
//                   className="w-full border-2 hover:border-primary-600 dark:hover:border-primary-400 group"
//                 >
//                   <span>{language === 'vi' ? 'Chỉnh sửa hồ sơ' : 'Edit Profile'}</span>
//                   <ArrowRight size={18} className="ml-2 inline-block group-hover:translate-x-1 transition-transform" />
//                 </Button>
//               </div>
//             </CardContent>
//           </Card>
//         </div>

//         {/* Admin Panel Link */}
//         {user.role === 'admin' && (
//           <div className={`mt-6 transition-all duration-700 delay-200 transform ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
//             <Card className="bg-gradient-to-br from-orange-50 to-rose-50 dark:from-orange-950 dark:to-rose-950 backdrop-blur-xl border border-orange-200/50 dark:border-orange-800/50 hover:shadow-[0_0_25px_rgba(255,89,89,0.15)] transition-all duration-300 hover:scale-[1.02]">
//               <CardHeader>
//                 <CardTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-rose-600 dark:from-orange-400 dark:to-rose-400">
//                   {language === 'vi' ? 'Quản trị viên' : 'Admin Panel'}
//                 </CardTitle>
//                 <CardDescription className="text-orange-700 dark:text-orange-300">
//                   {language === 'vi' ? 'Quản lý hệ thống và bài tập' : 'Manage system and challenges'}
//                 </CardDescription>
//               </CardHeader>
//               <CardContent>
//                 <Button 
//                   className="bg-gradient-to-r from-orange-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
//                   onClick={() => window.location.href = '/admin/dashboard'}
//                 >
//                   <span>{language === 'vi' ? 'Truy cập Admin Panel' : 'Access Admin Panel'}</span>
//                   <ArrowRight size={18} className="ml-2 inline-block group-hover:translate-x-1 transition-transform" />
//                 </Button>
//               </CardContent>
//             </Card>
//           </div>
//         )}

//         {/* Background decorations */}
//         <div className="absolute top-20 right-0 w-60 h-60 bg-yellow-400/5 rounded-full blur-3xl"></div>
//         <div className="absolute bottom-4 left-6 w-60 h-60 bg-primary-400/5 rounded-full blur-3xl"></div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;
