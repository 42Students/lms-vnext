import { useEffect, useState } from 'react';
import Api from '@/api/ApiMethod';
import { notification } from 'antd';
import { ExclamationCircleOutlined } from "@ant-design/icons";

export const useContacts = (userType) => {
  const [data, setData] = useState([]);
  // Real paging defaults from the first render: an empty object made the grid's first page NaN
  // (antd logged "current should be positive number" on every People Directory visit).
  const [query, setQuery] = useState({ pageNumber: 0, pageSize: 10 });
  const [totalContacts, setTotalContacts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [notificationApi, notificationContext] = notification.useNotification()

  useEffect(() => {
    const { collegeId } = query;
    if (!collegeId) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    Api.get(`/users/contacts`, { params: {...query, userType}, signal: controller.signal })
    .then(res => res.data.data)
    .then((res) => {
      setTotalContacts(res?.size ?? 0);
      setData((res?.contactDTOList ?? []).map((contact, i) => ({...contact, key: i})));
    })
    .catch((err) => {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      notificationApi.info({
        message: "Couldn't load contacts",
        description: "Something went wrong on our end. Please refresh the page or try again shortly.",
        icon: <ExclamationCircleOutlined style={{ color: "red" }} />,
        placement: 'bottomRight',
        duration: 5,
      });
      setData([]);
      setError(true);
    })
    .finally(() => {
      setLoading(false);
    });
    return () => controller.abort();
  }, [userType, query, reloadKey]);

  const retry = () => setReloadKey((key) => key + 1);
  return { data, loading, error, retry, query, setQuery, totalContacts, notificationContext };
}
