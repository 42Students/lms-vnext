import CustomButton from "@/components/Global/Button/button";
import { Space, Avatar, Row } from "antd";
import Image from "next/image";

export default function Organizations({ organizations = [] }) {
  return (
    <Space
      direction="vertical"
      style={{ maxHeight: "calc(70px * 5)", overflow: "auto" }}
      size={24}
    >
      {organizations.map((organization, index) => (
        <Space align="start" size={24} key={index}>
          <Avatar
            shape="square"
            size={45}
            icon={
              <Image
                src={organization.image}
                alt={organization.name}
                width={45}
                height={45}
              />
            }
          ></Avatar>
          <div className="clrgray2BB ln-lto-reg lh-base">
            <div className="ln-lto-bold clrB517">{organization.name}</div>
            <div className="fnt-12">{organization.role}</div>
          </div>
        </Space>
      ))}
    </Space>
  );
}
