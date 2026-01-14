import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
    return <LoadingSpinner text="載入長者資料..." fullPage />;
  }

  return (
    <div className="liff-elder-list">
      {/* Header */}
      <div className="liff-elder-list__header">
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenModal}
          >
            新增長者
          </Button>
        )}
        <div>
          {/* <h1 className="liff-elder-list__title">長者列表</h1> */}
          <p className="text-body-2 text-secondary">
            共 {elders.length} 位長者
          </p>
        </div>
      </div>

      {/* Elder Cards */}
      {elders.length === 0 ? (
        <div className="liff-elder-list__empty paper paper--elevated">
          <h3 className="h5 mb-3">暫無長者資料</h3>
          <p className="text-body-2 text-secondary mb-4">
            {isAdmin
              ? "請點擊上方按鈕新增長者資料"
              : "請聯絡管理員新增長者資料"}
          </p>
          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={handleOpenModal}
            >
              新增第一位長者
            </Button>
          )}
        </div>
      ) : (
        <div className="liff-elder-list__cards">
          {elders.map((elder) => (
            <ElderCard
              key={elder.id}
              elder={elder}
              onClick={handleElderClick}
            />
          ))}
        </div>
      )}

      {/* Add Elder Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title="新增長者"
        size="md"
      >
        <form onSubmit={handleSubmit} className="flex flex-column gap-4">
          <TextField
            label="姓名"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            fullWidth
          />

          <div className="grid grid--cols-2 grid--gap-4">
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
          </div>

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

          {!formData.deviceId && (
            <TextField
              label="裝置 MAC Address（手動輸入）"
              value={formData.macAddress}
              onChange={(e) =>
                setFormData({ ...formData, macAddress: e.target.value })
              }
              placeholder="例如：AA:BB:CC:DD:EE:FF"
              fullWidth
              helperText="如果上方未選擇裝置，請手動輸入 MAC Address"
            />
          )}

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

          <div className="flex flex-end gap-3 mt-4">
            <Button onClick={handleCloseModal} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {isSubmitting ? "處理中..." : "確定"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
