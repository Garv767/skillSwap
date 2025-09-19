import React from 'react';
import { Box, Container, Typography, Button, Grid, Card, CardContent, Chip } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { SwapHoriz, People, TrendingUp, Security } from '@mui/icons-material';

const Home = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <SwapHoriz color="primary" />,
      title: 'Skill Exchange',
      description: 'Trade your expertise with others without money. Learn and teach simultaneously.'
    },
    {
      icon: <People color="primary" />,
      title: 'Community Driven',
      description: 'Join a collaborative ecosystem where everyone helps each other grow.'
    },
    {
      icon: <TrendingUp color="primary" />,
      title: 'Build Your Portfolio',
      description: 'Showcase your work and build a reputation through reviews and completed trades.'
    },
    {
      icon: <Security color="primary" />,
      title: 'Secure & Trustworthy',
      description: 'Our rating system and dispute resolution ensure safe skill exchanges.'
    }
  ];

  const popularSkills = [
    'Web Development', 'Graphic Design', 'Digital Marketing', 'Writing',
    'Photography', 'Data Analysis', 'UI/UX Design', 'Video Editing'
  ];

  return (
    <>
      <Helmet>
        <title>SkillSwap - Exchange Skills Without Money</title>
        <meta name="description" content="Join SkillSwap to trade skills without money. Learn, teach, and grow in a collaborative community." />
      </Helmet>

      {/* Hero Section */}
      <Box sx={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        py: { xs: 8, md: 12 }
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h1" sx={{ mb: 3, fontSize: { xs: '2.5rem', md: '3.5rem' } }}>
                Exchange Skills
                <br />
                Without Money
              </Typography>
              <Typography variant="h5" sx={{ mb: 4, opacity: 0.9, fontWeight: 400 }}>
                Join thousands of learners and teachers in our skill-sharing community.
                Trade expertise, build connections, and grow together.
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
                  onClick={() => navigate('/register')}
                >
                  Get Started Free
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.200' } }}
                  component={RouterLink}
                  to="/skills"
                >
                  Browse Skills
                </Button>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ textAlign: 'center' }}>
                <img 
                  src="/api/placeholder/600/400" 
                  alt="Skill Exchange Illustration" 
                  style={{ maxWidth: '100%', height: 'auto', borderRadius: '12px' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Typography variant="h2" align="center" sx={{ mb: 6 }}>
          Why Choose SkillSwap?
        </Typography>
        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" sx={{ mb: 2 }}>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Popular Skills Section */}
      <Box sx={{ bgcolor: 'background.default', py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Typography variant="h2" align="center" sx={{ mb: 6 }}>
            Popular Skills
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
            {popularSkills.map((skill, index) => (
              <Chip 
                key={index} 
                label={skill} 
                variant="outlined" 
                sx={{ m: 0.5 }}
                clickable
                component={RouterLink}
                to={`/skills?search=${encodeURIComponent(skill)}`}
              />
            ))}
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Button 
              variant="contained" 
              component={RouterLink} 
              to="/skills"
              size="large"
            >
              Explore All Skills
            </Button>
          </Box>
        </Container>
      </Box>

      {/* CTA Section */}
      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
        <Box sx={{ textAlign: 'center', bgcolor: 'primary.main', color: 'white', p: 6, borderRadius: 2 }}>
          <Typography variant="h3" sx={{ mb: 2 }}>
            Ready to Start Trading Skills?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
            Join our community and unlock a world of learning opportunities.
          </Typography>
          <Button
            variant="contained"
            size="large"
            sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: 'grey.100' } }}
            onClick={() => navigate('/register')}
          >
            Sign Up Now
          </Button>
        </Box>
      </Container>
    </>
  );
};

export default Home;