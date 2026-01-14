import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Button from "@mui/material/Button";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import BusinessIcon from "@mui/icons-material/Business";
import PeopleIcon from "@mui/icons-material/People";
import NotificationsIcon from "@mui/icons-material/Notifications";
import GroupIcon from "@mui/icons-material/Group";
import DevicesIcon from "@mui/icons-material/Devices";
import RouterIcon from "@mui/icons-material/Router";
import LogoutIcon from "@mui/icons-material/Logout";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import { HardwareSimulator } from "../components/HardwareSimulator";
import { useAppStore } from "../../store/store";
import { useAuth } from "../../contexts/AuthContext";

export const AdminDashboard: React.FC = () => {
  const { tenants, elders, alerts, fetchTenants, fetchElders } = useAppStore();
  const { currentUser, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTenants();
    fetchElders();
    // Note: fetchAlerts needs tenantId, so we'll skip it for now
  }, [fetchTenants, fetchElders]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/login");
    } catch (error) {
      console.error("登出失敗:", error);
    }
  };

  const stats = [
    {
      title: "總社區數",
      value: tenants.length,
      icon: <BusinessIcon />,
      color: "#1976d2",
      bgColor: "#e3f2fd",
    },
    {
      title: "總長者數",
      value: elders.length,
      icon: <PeopleIcon />,
      color: "#2e7d32",
      bgColor: "#e8f5e9",
    },
    {
      title: "待處理警報",
      value: alerts.filter((a) => a.status === "pending").length,
      icon: <NotificationsIcon />,
      color: "#d32f2f",
      bgColor: "#ffebee",
    },
  ];

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={4}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
                gutterBottom
                fontWeight={600}
              >
                Community Guardian
              </Typography>
              <Typography variant="body1" color="text.secondary">
                守護系統管理平台
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Tooltip title={currentUser?.email || "管理員"}>
                <Box display="flex" alignItems="center" gap={1}>
                  <AccountCircleIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    {currentUser?.email?.split("@")[0]}
                  </Typography>
                </Box>
              </Tooltip>
              <Tooltip title="登出">
                <IconButton onClick={handleSignOut} color="error">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
          <Box display="flex" gap={2} mt={2} flexWrap="wrap">
            <Button
              component={Link}
              to="/admin/tenants"
              variant="contained"
              startIcon={<BusinessIcon />}
            >
              社區管理
            </Button>
            <Button
              component={Link}
              to="/admin/elders"
              variant="contained"
              color="success"
              startIcon={<GroupIcon />}
            >
              長者管理
            </Button>
            <Button
              component={Link}
              to="/admin/devices"
              variant="contained"
              color="info"
              startIcon={<DevicesIcon />}
            >
              裝置管理
            </Button>
            <Button
              component={Link}
              to="/admin/gateways"
              variant="contained"
              color="warning"
              startIcon={<RouterIcon />}
            >
              接收點管理
            </Button>
          </Box>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
              <Card elevation={2}>
                <CardContent>
                  <Box display="flex" alignItems="center">
                    <Avatar
                      sx={{
                        bgcolor: stat.bgColor,
                        color: stat.color,
                        width: 56,
                        height: 56,
                      }}
                    >
                      {stat.icon}
                    </Avatar>
                    <Box ml={2}>
                      <Typography variant="body2" color="text.secondary">
                        {stat.title}
                      </Typography>
                      <Typography variant="h4" fontWeight={600}>
                        {stat.value}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Hardware Simulator */}
        <HardwareSimulator />
      </Container>
    </Box>
  );
};
