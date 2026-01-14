import React, { useState } from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";
import { HardwareSimulator } from "../components/HardwareSimulator";
import { LineNotificationTester } from "../components/LineNotificationTester";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`testing-tabpanel-${index}`}
      aria-labelledby={`testing-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export const TestingTools: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh", py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Box mb={4}>
          <Button
            component={Link}
            to="/admin"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2 }}
          >
            返回主控台
          </Button>
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            🧪 測試工具
          </Typography>
          <Typography variant="body1" color="text.secondary">
            硬體訊號模擬與 LINE 通知測試
          </Typography>
        </Box>

        {/* Tabs */}
        <Paper elevation={2}>
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="testing tools tabs"
            variant="fullWidth"
          >
            <Tab label="📡 硬體訊號模擬器" />
            <Tab label="📱 LINE 通知測試" />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <HardwareSimulator />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <LineNotificationTester />
          </TabPanel>
        </Paper>
      </Container>
    </Box>
  );
};
