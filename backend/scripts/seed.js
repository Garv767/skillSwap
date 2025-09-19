const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Skill = require('../models/Skill');
const Trade = require('../models/Trade');
const Message = require('../models/Message');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('✅ MongoDB connected for seeding');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Skills data
const skillsData = [
  // Technology
  { name: 'javascript', displayName: 'JavaScript', category: 'technology', description: 'Programming language for web development', difficulty: 'Intermediate' },
  { name: 'react', displayName: 'React', category: 'technology', description: 'JavaScript library for building user interfaces', difficulty: 'Intermediate' },
  { name: 'nodejs', displayName: 'Node.js', category: 'technology', description: 'JavaScript runtime for backend development', difficulty: 'Intermediate' },
  { name: 'python', displayName: 'Python', category: 'technology', description: 'Versatile programming language', difficulty: 'Beginner' },
  { name: 'mongodb', displayName: 'MongoDB', category: 'technology', description: 'NoSQL database', difficulty: 'Intermediate' },
  { name: 'docker', displayName: 'Docker', category: 'technology', description: 'Containerization platform', difficulty: 'Advanced' },
  
  // Design
  { name: 'photoshop', displayName: 'Adobe Photoshop', category: 'design', description: 'Image editing and graphic design software', difficulty: 'Intermediate' },
  { name: 'figma', displayName: 'Figma', category: 'design', description: 'UI/UX design tool', difficulty: 'Beginner' },
  { name: 'illustrator', displayName: 'Adobe Illustrator', category: 'design', description: 'Vector graphics editor', difficulty: 'Intermediate' },
  { name: 'ui-design', displayName: 'UI Design', category: 'design', description: 'User interface design principles', difficulty: 'Intermediate' },
  
  // Business
  { name: 'project-management', displayName: 'Project Management', category: 'business', description: 'Planning and executing projects', difficulty: 'Intermediate' },
  { name: 'business-analysis', displayName: 'Business Analysis', category: 'business', description: 'Analyzing business requirements', difficulty: 'Advanced' },
  { name: 'accounting', displayName: 'Accounting', category: 'business', description: 'Financial record keeping', difficulty: 'Intermediate' },
  
  // Marketing
  { name: 'digital-marketing', displayName: 'Digital Marketing', category: 'marketing', description: 'Online marketing strategies', difficulty: 'Intermediate' },
  { name: 'seo', displayName: 'SEO', category: 'marketing', description: 'Search engine optimization', difficulty: 'Intermediate' },
  { name: 'social-media', displayName: 'Social Media Marketing', category: 'marketing', description: 'Marketing on social platforms', difficulty: 'Beginner' },
  
  // Writing
  { name: 'copywriting', displayName: 'Copywriting', category: 'writing', description: 'Writing persuasive content', difficulty: 'Intermediate' },
  { name: 'technical-writing', displayName: 'Technical Writing', category: 'writing', description: 'Writing technical documentation', difficulty: 'Advanced' },
  { name: 'content-writing', displayName: 'Content Writing', category: 'writing', description: 'Creating engaging written content', difficulty: 'Beginner' },
  
  // Languages
  { name: 'spanish', displayName: 'Spanish', category: 'languages', description: 'Spanish language skills', difficulty: 'Intermediate' },
  { name: 'french', displayName: 'French', category: 'languages', description: 'French language skills', difficulty: 'Intermediate' },
  { name: 'mandarin', displayName: 'Mandarin Chinese', category: 'languages', description: 'Mandarin Chinese language skills', difficulty: 'Advanced' },
  
  // Arts
  { name: 'photography', displayName: 'Photography', category: 'arts', description: 'Digital and film photography', difficulty: 'Intermediate' },
  { name: 'video-editing', displayName: 'Video Editing', category: 'arts', description: 'Post-production video editing', difficulty: 'Intermediate' },
  { name: 'music-production', displayName: 'Music Production', category: 'music', description: 'Creating and producing music', difficulty: 'Advanced' },
];

// Sample users data
const usersData = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    bio: 'Full-stack developer with 5+ years of experience. Passionate about React and Node.js.',
    location: { city: 'San Francisco', state: 'CA', country: 'USA' },
    skills: [
      { name: 'JavaScript', level: 'Expert', category: 'Technology', description: 'Frontend and backend JavaScript development' },
      { name: 'React', level: 'Expert', category: 'Technology', description: 'React development with hooks and context' },
      { name: 'Node.js', level: 'Advanced', category: 'Technology', description: 'Backend API development' },
    ],
    seekingSkills: [
      { name: 'UI Design', level: 'Intermediate', category: 'Design', description: 'Want to learn modern UI design principles' },
      { name: 'Spanish', level: 'Beginner', category: 'Languages', description: 'Basic conversational Spanish' }
    ]
  },
  {
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah.wilson@example.com',
    password: 'password123',
    bio: 'Creative UI/UX designer with a passion for user-centered design.',
    location: { city: 'New York', state: 'NY', country: 'USA' },
    skills: [
      { name: 'UI Design', level: 'Expert', category: 'Design', description: 'Modern UI design and prototyping' },
      { name: 'Figma', level: 'Expert', category: 'Design', description: 'Advanced Figma prototyping' },
      { name: 'Adobe Photoshop', level: 'Advanced', category: 'Design', description: 'Image editing and manipulation' },
    ],
    seekingSkills: [
      { name: 'JavaScript', level: 'Intermediate', category: 'Technology', description: 'Want to learn frontend development' },
      { name: 'Photography', level: 'Beginner', category: 'Arts', description: 'Portrait and product photography' }
    ]
  },
  {
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@example.com',
    password: 'password123',
    bio: 'Digital marketing specialist and content creator.',
    location: { city: 'Los Angeles', state: 'CA', country: 'USA' },
    skills: [
      { name: 'Digital Marketing', level: 'Expert', category: 'Marketing', description: 'SEO, SEM, and social media marketing' },
      { name: 'Content Writing', level: 'Advanced', category: 'Writing', description: 'Blog posts and marketing copy' },
      { name: 'Social Media Marketing', level: 'Expert', category: 'Marketing', description: 'Instagram, Facebook, and LinkedIn marketing' },
    ],
    seekingSkills: [
      { name: 'Video Editing', level: 'Intermediate', category: 'Arts', description: 'Creating marketing videos' },
      { name: 'Python', level: 'Beginner', category: 'Technology', description: 'Data analysis for marketing' }
    ]
  },
  {
    firstName: 'Emma',
    lastName: 'Rodriguez',
    email: 'emma.rodriguez@example.com',
    password: 'password123',
    bio: 'Professional photographer and creative artist.',
    location: { city: 'Miami', state: 'FL', country: 'USA' },
    skills: [
      { name: 'Photography', level: 'Expert', category: 'Arts', description: 'Portrait, wedding, and commercial photography' },
      { name: 'Adobe Photoshop', level: 'Expert', category: 'Design', description: 'Photo retouching and manipulation' },
      { name: 'Video Editing', level: 'Advanced', category: 'Arts', description: 'Adobe Premiere and After Effects' },
    ],
    seekingSkills: [
      { name: 'Business Analysis', level: 'Intermediate', category: 'Business', description: 'Growing photography business' },
      { name: 'Digital Marketing', level: 'Intermediate', category: 'Marketing', description: 'Marketing photography services' }
    ]
  },
  {
    firstName: 'David',
    lastName: 'Kim',
    email: 'david.kim@example.com',
    password: 'password123',
    bio: 'Project manager and business consultant with expertise in agile methodologies.',
    location: { city: 'Seattle', state: 'WA', country: 'USA' },
    skills: [
      { name: 'Project Management', level: 'Expert', category: 'Business', description: 'Agile and waterfall project management' },
      { name: 'Business Analysis', level: 'Expert', category: 'Business', description: 'Requirements gathering and process improvement' },
      { name: 'Technical Writing', level: 'Advanced', category: 'Writing', description: 'Documentation and process writing' },
    ],
    seekingSkills: [
      { name: 'Python', level: 'Intermediate', category: 'Technology', description: 'Data analysis and automation' },
      { name: 'French', level: 'Beginner', category: 'Languages', description: 'Basic conversational French' }
    ]
  }
];

// Admin user
const adminUser = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@skillswap.com',
  password: 'admin123',
  bio: 'SkillSwap platform administrator.',
  location: { city: 'San Francisco', state: 'CA', country: 'USA' },
  role: 'admin',
  skills: [],
  seekingSkills: []
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Skill.deleteMany({}),
      Trade.deleteMany({}),
      Message.deleteMany({})
    ]);

    // Seed skills
    console.log('🌱 Seeding skills...');
    const skills = await Skill.insertMany(skillsData.map(skill => ({
      ...skill,
      isActive: true,
      isVerified: true,
      stats: {
        totalUsers: Math.floor(Math.random() * 100) + 10,
        totalOffers: Math.floor(Math.random() * 50) + 5,
        totalRequests: Math.floor(Math.random() * 30) + 3,
        totalTrades: Math.floor(Math.random() * 20) + 2
      }
    })));
    console.log(`✅ Created ${skills.length} skills`);

    // Seed users
    console.log('🌱 Seeding users...');
    const users = [];
    
    // Create regular users
    for (const userData of usersData) {
      const hashedPassword = await bcrypt.hash(userData.password, 12);
      const user = new User({
        ...userData,
        password: hashedPassword,
        isVerified: true,
        rating: {
          average: Math.random() * 2 + 3, // 3-5 stars
          totalReviews: Math.floor(Math.random() * 50) + 5
        },
        stats: {
          totalTrades: Math.floor(Math.random() * 20) + 5,
          completedTrades: Math.floor(Math.random() * 15) + 3,
          successRate: Math.floor(Math.random() * 30) + 70 // 70-100%
        }
      });
      await user.save();
      users.push(user);
    }

    // Create admin user
    const hashedAdminPassword = await bcrypt.hash(adminUser.password, 12);
    const admin = new User({
      ...adminUser,
      password: hashedAdminPassword,
      isVerified: true
    });
    await admin.save();
    users.push(admin);

    console.log(`✅ Created ${users.length} users (including admin)`);

    // Create some sample trades
    console.log('🌱 Seeding sample trades...');
    const trades = [];
    for (let i = 0; i < 5; i++) {
      const requester = users[Math.floor(Math.random() * (users.length - 1))]; // Exclude admin
      const provider = users[Math.floor(Math.random() * (users.length - 1))];
      
      if (requester._id.toString() !== provider._id.toString()) {
        const trade = new Trade({
          requester: requester._id,
          provider: provider._id,
          title: `${requester.skills[0]?.name || 'Skill'} for ${provider.skills[0]?.name || 'Skill'}`,
          description: 'Sample trade created during database seeding.',
          requestedSkill: {
            name: provider.skills[0]?.name || 'Sample Skill',
            level: provider.skills[0]?.level || 'Intermediate',
            category: provider.skills[0]?.category || 'Technology',
            description: 'Sample requested skill description',
            estimatedHours: Math.floor(Math.random() * 10) + 5
          },
          offeredSkill: {
            name: requester.skills[0]?.name || 'Sample Skill',
            level: requester.skills[0]?.level || 'Intermediate', 
            category: requester.skills[0]?.category || 'Technology',
            description: 'Sample offered skill description',
            estimatedHours: Math.floor(Math.random() * 10) + 5
          },
          status: ['pending', 'accepted', 'in_progress'][Math.floor(Math.random() * 3)],
          meetingPreferences: {
            type: 'Virtual',
            timezone: 'UTC',
            preferredDays: ['Monday', 'Wednesday', 'Friday']
          }
        });
        
        await trade.save();
        trades.push(trade);
      }
    }
    console.log(`✅ Created ${trades.length} sample trades`);

    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📊 Seeded data summary:');
    console.log(`   • ${skills.length} skills`);
    console.log(`   • ${users.length - 1} regular users`);
    console.log(`   • 1 admin user`);
    console.log(`   • ${trades.length} sample trades`);
    console.log('\n🔑 Login credentials:');
    console.log('   Regular users: use any email above with password "password123"');
    console.log('   Admin: admin@skillswap.com / admin123');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Run seeding
const runSeed = async () => {
  await connectDB();
  await seedDatabase();
  await mongoose.connection.close();
  console.log('✅ Database connection closed');
  process.exit(0);
};

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n👋 Seeding interrupted');
  await mongoose.connection.close();
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('❌ Uncaught Exception:', error);
  await mongoose.connection.close();
  process.exit(1);
});

if (require.main === module) {
  runSeed();
}

module.exports = { seedDatabase };