import React, { useState } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Button from "@mui/material/Button";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";
import { TestTube, Radio, Smartphone } from 'lucide-react';
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
      {value === index && <div className="p-6">{children}</div>}
    </div>
  );
}

export const TestingTools: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  return (
    <div className="testing-tools">
      <div className="container container--xl">
        {/* Header */}
        <div className="testing-tools__header">
          <Button
            component={Link}
            to="/admin"
            startIcon={<ArrowBackIcon />}
            className="mb-4"
          >
            返回主控台
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <TestTube size={32} color="#1976d2" />
            <h1 className="testing-tools__title">測試工具</h1>
          </div>
          <p className="testing-tools__subtitle">
            硬體訊號模擬與 LINE 通知測試
          </p>
        </div>

        {/* Tabs */}
        <div className="paper paper--elevated">
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            aria-label="testing tools tabs"
            variant="fullWidth"
          >
            <Tab 
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Radio size={18} />
                  <span>硬體訊號模擬器</span>
                </div>
              } 
            />
            <Tab 
              label={
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Smartphone size={18} />
                  <span>LINE 通知測試</span>
                </div>
              } 
            />
          </Tabs>

          <TabPanel value={currentTab} index={0}>
            <HardwareSimulator />
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <LineNotificationTester />
          </TabPanel>
        </div>
      </div>
    </div>
  );
};
