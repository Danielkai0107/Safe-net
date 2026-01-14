import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import AddIcon from "@mui/icons-material/Add";
import { useAppStore } from "../../store/store";
import { ElderCard } from "../../components/ElderCard";
import { LoadingSpinner } from "../../components/LoadingSpinner";
import { Modal } from "../../components/Modal";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import type { Elder, Gender, CreateElderRequest, Device } from "../../types";

export const ElderList: React.FC = () => {
  const navigate = useNavigate();
  const { elders, isLoading, currentTenantId, isAdmin, fetchElders } =
    useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [formData, setFormData] = useState<Partial<CreateElderRequest>>({
    name: "",
    age: undefined,
    gender: undefined,
    address: "",
    contactPhone: "",
    emergencyContact: "",
    emergencyPhone: "",
    macAddress: "",
    deviceId: "",
    notes: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (currentTenantId) {
      fetchAvailableDevices();
    }
  }, [currentTenantId]);

  const fetchAvailableDevices = async () => {
    if (!currentTenantId) return;

    setLoadingDevices(true);
    try {
      const devicesRef = collection(db, "devices");
      const q = query(
        devicesRef,
        where("tenantId", "==", currentTenantId),
        where("status", "==", "available")
      );
      const snapshot = await getDocs(q);

      const devices = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      })) as Device[];

      setAvailableDevices(devices);
    } catch (error: any) {
      console.error("Failed to fetch devices:", error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleElderClick = (elder: Elder) => {
    navigate(`/liff/elder/${elder.id}`);
  };

  const handleOpenModal = () => {
    setFormData({
      name: "",
      age: undefined,
      gender: undefined,
      address: "",
      contactPhone: "",
      emergencyContact: "",
      emergencyPhone: "",
      macAddress: "",
      deviceId: "",
      notes: "",
    });
    fetchAvailableDevices();
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !currentTenantId) {
      alert("請填寫必填欄位（姓名）");
      return;
    }

    // 如果選擇了裝置，則使用裝置的 MAC Address
    let macAddress = formData.macAddress;
    const deviceId = formData.deviceId;

    if (deviceId) {
      const selectedDevice = availableDevices.find((d) => d.id === deviceId);
      if (selectedDevice) {
        macAddress = selectedDevice.macAddress;
      }
    }

    if (!macAddress) {
      alert("請選擇裝置或輸入 MAC Address");
      return;
    }

    setIsSubmitting(true);
    try {
      const now = new Date().toISOString();

      const elderRef = await addDoc(collection(db, "elders"), {
        tenantId: currentTenantId,
        name: formData.name,
        age: formData.age || null,
        gender: formData.gender || null,
        address: formData.address || null,
        contactPhone: formData.contactPhone || null,
        emergencyContact: formData.emergencyContact || null,
        emergencyPhone: formData.emergencyPhone || null,
        macAddress,
        deviceId: deviceId || null,
        status: "offline" as const,
        lastSeen: now,
        notes: formData.notes || null,
        createdAt: now,
        updatedAt: now,
      });

      // 更新裝置狀態為已配發
      if (deviceId) {
        await updateDoc(doc(db, "devices", deviceId), {
          status: "assigned",
          assignedElderId: elderRef.id,
          assignedElderName: formData.name,
          updatedAt: now,
        });
      }

      alert("新增成功！");
      handleCloseModal();

      // Refresh elders list
      if (currentTenantId) {
        await fetchElders(currentTenantId);
      }
    } catch (error: any) {
      console.error("Error adding elder:", error);
      alert("新增失敗：" + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="載入長者資料..." />;
  }

  if (elders.length === 0) {
    return (
      <Box>
        <Box
          mb={3}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5" fontWeight={600}>
              長者列表
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              共 0 位長者
            </Typography>
          </Box>
          {isAdmin && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
            >
              新增長者
            </Button>
          )}
        </Box>

        <Box
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            boxShadow: 2,
            p: 6,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暫無長者資料
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={2}>
            {isAdmin
              ? "請點擊上方按鈕新增長者資料"
              : "請聯絡管理員新增長者資料"}
          </Typography>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
            >
              新增第一位長者
            </Button>
          )}
        </Box>

        {/* Add Elder Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title="新增長者"
          size="md"
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
          >
            <TextField
              label="姓名"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              fullWidth
            />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="年齡"
                  type="number"
                  value={formData.age || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      age: e.target.value
                        ? parseInt(e.target.value)
                        : undefined,
                    })
                  }
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="性別"
                  select
                  value={formData.gender || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      gender: e.target.value as Gender,
                    })
                  }
                  fullWidth
                >
                  <MenuItem value="male">男</MenuItem>
                  <MenuItem value="female">女</MenuItem>
                  <MenuItem value="other">其他</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <TextField
              label="地址"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="聯絡電話"
              value={formData.contactPhone}
              onChange={(e) =>
                setFormData({ ...formData, contactPhone: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="緊急聯絡人"
              value={formData.emergencyContact}
              onChange={(e) =>
                setFormData({ ...formData, emergencyContact: e.target.value })
              }
              fullWidth
            />

            <TextField
              label="緊急聯絡電話"
              value={formData.emergencyPhone}
              onChange={(e) =>
                setFormData({ ...formData, emergencyPhone: e.target.value })
              }
              fullWidth
            />

            <TextField
              select
              label="選擇裝置（推薦）"
              value={formData.deviceId}
              onChange={(e) =>
                setFormData({ ...formData, deviceId: e.target.value })
              }
              fullWidth
              disabled={loadingDevices}
              helperText={
                loadingDevices
                  ? "載入裝置中..."
                  : availableDevices.length === 0
                  ? "暫無可用裝置，請手動輸入 MAC Address"
                  : "從社區配發的裝置中選擇"
              }
            >
              <MenuItem value="">不選擇（手動輸入MAC）</MenuItem>
              {availableDevices.map((device) => (
                <MenuItem key={device.id} value={device.id}>
                  {device.deviceNumber} - {device.macAddress}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="或手動輸入 MAC 位址"
              value={formData.macAddress}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  macAddress: e.target.value.toUpperCase(),
                  deviceId: "",
                })
              }
              fullWidth
              disabled={!!formData.deviceId}
              helperText={
                formData.deviceId
                  ? "已選擇裝置，無需手動輸入"
                  : "如果不從上方選擇裝置，請手動輸入"
              }
              placeholder="AA:BB:CC:DD:EE:FF"
            />

            <TextField
              label="備註"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              multiline
              rows={3}
              fullWidth
            />

            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button
                variant="outlined"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "新增中..." : "新增"}
              </Button>
            </Box>
          </Box>
        </Modal>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        mb={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Box>
          <Typography variant="h5" fontWeight={600}>
            長者列表
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            共 {elders.length} 位長者
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            新增長者
          </Button>
        )}
      </Box>

      <Grid container spacing={2}>
        {elders.map((elder) => (
          <Grid size={{ xs: 12, md: 6 }} key={elder.id}>
            <ElderCard elder={elder} onClick={handleElderClick} />
          </Grid>
        ))}
      </Grid>

      {/* Add Elder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="新增長者"
        size="md"
      >
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
        >
          <TextField
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="年齡"
                type="number"
                value={formData.age || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    age: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                label="性別"
                select
                value={formData.gender || ""}
                onChange={(e) =>
                  setFormData({ ...formData, gender: e.target.value as Gender })
                }
                fullWidth
              >
                <MenuItem value="male">男</MenuItem>
                <MenuItem value="female">女</MenuItem>
                <MenuItem value="other">其他</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <TextField
            label="地址"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
            fullWidth
          />

          <TextField
            label="聯絡電話"
            value={formData.contactPhone}
            onChange={(e) =>
              setFormData({ ...formData, contactPhone: e.target.value })
            }
            fullWidth
          />

          <TextField
            label="緊急聯絡人"
            value={formData.emergencyContact}
            onChange={(e) =>
              setFormData({ ...formData, emergencyContact: e.target.value })
            }
            fullWidth
          />

          <TextField
            label="緊急聯絡電話"
            value={formData.emergencyPhone}
            onChange={(e) =>
              setFormData({ ...formData, emergencyPhone: e.target.value })
            }
            fullWidth
          />

          <TextField
            select
            label="選擇裝置（推薦）"
            value={formData.deviceId}
            onChange={(e) =>
              setFormData({ ...formData, deviceId: e.target.value })
            }
            fullWidth
            disabled={loadingDevices}
            helperText={
              loadingDevices
                ? "載入裝置中..."
                : availableDevices.length === 0
                ? "暫無可用裝置，請手動輸入 MAC Address"
                : "從社區配發的裝置中選擇"
            }
          >
            <MenuItem value="">不選擇（手動輸入MAC）</MenuItem>
            {availableDevices.map((device) => (
              <MenuItem key={device.id} value={device.id}>
                {device.deviceNumber} - {device.macAddress}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="或手動輸入 MAC 位址"
            value={formData.macAddress}
            onChange={(e) =>
              setFormData({
                ...formData,
                macAddress: e.target.value.toUpperCase(),
                deviceId: "",
              })
            }
            fullWidth
            disabled={!!formData.deviceId}
            helperText={
              formData.deviceId
                ? "已選擇裝置，無需手動輸入"
                : "如果不從上方選擇裝置，請手動輸入"
            }
            placeholder="AA:BB:CC:DD:EE:FF"
          />

          <TextField
            label="備註"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            multiline
            rows={3}
            fullWidth
          />

          <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
            <Button
              variant="outlined"
              onClick={handleCloseModal}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "新增中..." : "新增"}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};
