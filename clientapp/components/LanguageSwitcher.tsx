import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useParams } from 'react-router';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "components/ui/dropdown-menu";
import { Button } from "components/ui/button";
import { Globe } from "lucide-react";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
];

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const currentLng = params.lng || 'en';

  const changeLanguage = (lng: string) => {
    // 获取当前路径
    const currentPath = window.location.pathname;
    // 替换路径中的语言部分
    const newPath = currentPath.replace(`/${currentLng}/`, `/${lng}/`);
    // 导航到新路径
    navigate(newPath);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Globe className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={currentLng === lang.code ? "font-bold" : ""}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher; 