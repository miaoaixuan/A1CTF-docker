package clientconfig

import (
	"encoding/json"
	"os"
	"path/filepath"
	"time"
)

// SystemSettings 系统设置结构体
type SystemSettings struct {
	// 基本信息
	SystemName    string `json:"systemName"`
	SystemLogo    string `json:"systemLogo"`
	SystemSlogan  string `json:"systemSlogan"`
	SystemSummary string `json:"systemSummary"`
	SystemFooter  string `json:"systemFooter"`
	SystemFavicon string `json:"systemFavicon"`

	SystemICP             string `json:"systemICP"`
	SystemOrganization    string `json:"systemOrganization"`
	SystemOrganizationURL string `json:"systemOrganizationURL"`

	// 主题设置
	ThemeColor      string `json:"themeColor"`
	DarkModeDefault bool   `json:"darkModeDefault"`
	AllowUserTheme  bool   `json:"allowUserTheme"`

	// 品牌资源
	FancyBackGroundIconWhite string `json:"fancyBackGroundIconWhite"`
	FancyBackGroundIconBlack string `json:"fancyBackGroundIconBlack"`
	DefaultBGImage           string `json:"defaultBGImage"`
	SVGIconLight             string `json:"svgIconLight"`
	SVGIconDark              string `json:"svgIconDark"`
	SVGAltData               string `json:"svgAltData"`
	TrophysGold              string `json:"trophysGold"`
	TrophysSilver            string `json:"trophysSilver"`
	TrophysBronze            string `json:"trophysBronze"`
	SchoolLogo               string `json:"schoolLogo"`
	SchoolSmallIcon          string `json:"schoolSmallIcon"`
	SchoolUnionAuthText      string `json:"schoolUnionAuthText"`
	BGAnimation              bool   `json:"bgAnimation"`

	FancyBackGroundIconWidth  float64 `json:"fancyBackGroundIconWidth"`
	FancyBackGroundIconHeight float64 `json:"fancyBackGroundIconHeight"`

	// SMTP设置
	SmtpHost      string `json:"smtpHost"`
	SmtpPort      int    `json:"smtpPort"`
	SmtpUsername  string `json:"smtpUsername"`
	SmtpPassword  string `json:"smtpPassword"`
	SmtpFrom      string `json:"smtpFrom"`
	SmtpEnabled   bool   `json:"smtpEnabled"`
	EmailTemplate string `json:"emailTemplate"`

	// Proof-of-work 验证码设置
	CaptchaEnabled bool `json:"captchaEnabled"`

	// 比赛模式
	GameActivityMode string `json:"gameActivityMode"`

	AboutUS string `json:"aboutus"`

	// 账户激活策略
	AccountActivationMethod string `json:"accountActivationMethod"`
	RegistrationEnabled     bool   `json:"registrationEnabled"`

	// 其他系统设置
	DefaultLanguage string `json:"defaultLanguage"`
	TimeZone        string `json:"timeZone"`
	MaxUploadSize   int    `json:"maxUploadSize"`

	// 保存时间
	UpdatedTime time.Time `json:"updatedTime"`
}

// 默认系统设置
var DefaultSettings = SystemSettings{
	SystemName:            "A1CTF",
	SystemSlogan:          "A Modern CTF Platform",
	SystemFooter:          "© 2023 A1CTF Team",
	SystemICP:             "浙ICP备2023022969号",
	SystemOrganization:    "浙江师范大学",
	SystemOrganizationURL: "https://www.zjnu.edu.cn",
	ThemeColor:            "blue",
	DarkModeDefault:       true,
	AllowUserTheme:        true,

	// 品牌资源默认值
	FancyBackGroundIconWhite: "/images/ctf_white.png",
	FancyBackGroundIconBlack: "/images/ctf_black.png",
	DefaultBGImage:           "/images/defaultbg.jpg",
	SVGIconLight:             "/images/A1natas.svg",
	SVGIconDark:              "/images/A1natas_white.svg",

	FancyBackGroundIconWidth:  241.2,
	FancyBackGroundIconHeight: 122.39,

	SVGAltData:          "A1natas",
	TrophysGold:         "/images/trophys/gold_trophy.png",
	TrophysSilver:       "/images/trophys/silver_trophy.png",
	TrophysBronze:       "/images/trophys/copper_trophy.png",
	SchoolLogo:          "/images/zjnu_logo.png",
	SchoolSmallIcon:     "/images/zjnu_small_logo.png",
	SchoolUnionAuthText: "ZJNU Union Authserver",
	EmailTemplate:       "",
	BGAnimation:         false,

	CaptchaEnabled: true,
	AboutUS:        "A1CTF Platform",

	SmtpPort:                587,
	DefaultLanguage:         "zh-CN",
	TimeZone:                "Asia/Shanghai",
	MaxUploadSize:           10,
	AccountActivationMethod: "email",
	RegistrationEnabled:     true,
	UpdatedTime:             time.Now().UTC(),
}

var ClientConfig SystemSettings

// 系统设置文件路径
const settingsFilePath = "./data/system_settings.json"

// 辅助函数
func LoadSystemSettings() (SystemSettings, error) {
	// 检查文件是否存在
	if _, err := os.Stat(settingsFilePath); os.IsNotExist(err) {
		// 文件不存在，创建默认设置
		if err := SaveSystemSettings(DefaultSettings); err != nil {
			return DefaultSettings, err
		}
		return DefaultSettings, nil
	}

	// 读取文件
	data, err := os.ReadFile(settingsFilePath)
	if err != nil {
		return DefaultSettings, err
	}

	// 解析JSON
	var settings SystemSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return DefaultSettings, err
	}

	ClientConfig = settings

	return settings, nil
}

func SaveSystemSettings(settings SystemSettings) error {

	settings.UpdatedTime = time.Now().UTC()

	ClientConfig = settings

	// 创建目录
	dir := filepath.Dir(settingsFilePath)
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}

	// 序列化为JSON
	data, err := json.MarshalIndent(settings, "", "  ")
	if err != nil {
		return err
	}

	// 写入文件
	return os.WriteFile(settingsFilePath, data, 0644)
}
