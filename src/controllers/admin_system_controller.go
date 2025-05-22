package controllers

import (
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
	SVGIcon                  string `json:"svgIcon"`
	SVGAltData               string `json:"svgAltData"`
	TrophysGold              string `json:"trophysGold"`
	TrophysSilver            string `json:"trophysSilver"`
	TrophysBronze            string `json:"trophysBronze"`
	SchoolLogo               string `json:"schoolLogo"`
	SchoolSmallIcon          string `json:"schoolSmallIcon"`
	SchoolUnionAuthText      string `json:"schoolUnionAuthText"`
	BGAnimation              bool   `json:"bgAnimation"`

	// SMTP设置
	SmtpHost     string `json:"smtpHost"`
	SmtpPort     int    `json:"smtpPort"`
	SmtpUsername string `json:"smtpUsername"`
	SmtpPassword string `json:"smtpPassword"`
	SmtpFrom     string `json:"smtpFrom"`
	SmtpEnabled  bool   `json:"smtpEnabled"`

	// Cloudflare Turnstile设置
	TurnstileSiteKey   string `json:"turnstileSiteKey"`
	TurnstileSecretKey string `json:"turnstileSecretKey"`
	TurnstileEnabled   bool   `json:"turnstileEnabled"`

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
var defaultSettings = SystemSettings{
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
	SVGIcon:                  "/images/A1natas.svg",
	SVGAltData:               "A1natas",
	TrophysGold:              "/images/trophys/gold_trophy.png",
	TrophysSilver:            "/images/trophys/silver_trophy.png",
	TrophysBronze:            "/images/trophys/copper_trophy.png",
	SchoolLogo:               "/images/zjnu_logo.png",
	SchoolSmallIcon:          "/images/zjnu_small_logo.png",
	SchoolUnionAuthText:      "ZJNU Union Authserver",
	BGAnimation:              false,

	SmtpPort:                587,
	DefaultLanguage:         "zh-CN",
	TimeZone:                "Asia/Shanghai",
	MaxUploadSize:           10,
	AccountActivationMethod: "email",
	RegistrationEnabled:     true,
	UpdatedTime:             time.Now(),
}

var ClientConfig SystemSettings

// 系统设置文件路径
const settingsFilePath = "./data/system_settings.json"

// GetSystemSettings 获取系统设置
func GetSystemSettings(c *gin.Context) {
	settings, err := LoadSystemSettings()
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"data": defaultSettings,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": settings,
	})
}

// UpdateSystemSettings 更新系统设置
func UpdateSystemSettings(c *gin.Context) {
	var settings SystemSettings
	if err := c.ShouldBindJSON(&settings); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求数据",
		})
		return
	}

	// 保存设置
	if err := saveSystemSettings(settings); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "保存系统设置失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "系统设置已更新",
	})
}

// UploadSystemFile 上传系统文件（图片）
func UploadSystemFile(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "文件上传失败: " + err.Error(),
		})
		return
	}

	// 检查文件类型
	if !isValidFileType(file.Filename) {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "不支持的文件类型",
		})
		return
	}

	// 创建上传目录
	uploadDir := "./uploads/system"
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "创建上传目录失败: " + err.Error(),
		})
		return
	}

	// 生成唯一文件名
	fileExt := filepath.Ext(file.Filename)
	fileName := uuid.New().String() + fileExt
	filePath := filepath.Join(uploadDir, fileName)

	// 保存文件
	if err := saveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "保存文件失败: " + err.Error(),
		})
		return
	}

	// 返回文件URL
	fileURL := "/uploads/system/" + fileName
	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": gin.H{
			"url": fileURL,
		},
	})
}

// TestSMTPSettings 测试SMTP设置
func TestSMTPSettings(c *gin.Context) {
	var smtpConfig struct {
		Host     string `json:"host"`
		Port     int    `json:"port"`
		Username string `json:"username"`
		Password string `json:"password"`
		From     string `json:"from"`
		To       string `json:"to"`
	}

	if err := c.ShouldBindJSON(&smtpConfig); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的请求数据",
		})
		return
	}

	// TODO: 实现SMTP测试逻辑

	c.JSON(http.StatusOK, gin.H{
		"code":    200,
		"message": "SMTP测试成功",
	})
}

// 辅助函数
func LoadSystemSettings() (SystemSettings, error) {
	// 检查文件是否存在
	if _, err := os.Stat(settingsFilePath); os.IsNotExist(err) {
		// 文件不存在，创建默认设置
		if err := saveSystemSettings(defaultSettings); err != nil {
			return defaultSettings, err
		}
		return defaultSettings, nil
	}

	// 读取文件
	data, err := os.ReadFile(settingsFilePath)
	if err != nil {
		return defaultSettings, err
	}

	// 解析JSON
	var settings SystemSettings
	if err := json.Unmarshal(data, &settings); err != nil {
		return defaultSettings, err
	}

	ClientConfig = settings

	return settings, nil
}

func saveSystemSettings(settings SystemSettings) error {

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

func isValidFileType(filename string) bool {
	ext := filepath.Ext(filename)
	validExts := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".gif":  true,
		".svg":  true,
		".ico":  true,
	}
	return validExts[ext]
}

func saveUploadedFile(file *multipart.FileHeader, dst string) error {
	src, err := file.Open()
	if err != nil {
		return err
	}
	defer src.Close()

	out, err := os.Create(dst)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, src)
	return err
}

// GetClientConfig 获取客户端配置
func GetClientConfig(c *gin.Context) {
	if ClientConfig.SystemName == "" {
		settings, err := LoadSystemSettings()
		if err != nil {
			settings = defaultSettings
		}
		settings.UpdatedTime = time.Now().UTC()
		ClientConfig = settings
	}

	// 创建客户端配置
	clientConfig := map[string]interface{}{
		"systemName":    ClientConfig.SystemName,
		"systemLogo":    ClientConfig.SystemLogo,
		"systemFavicon": ClientConfig.SystemFavicon,
		"systemSlogan":  ClientConfig.SystemSlogan,
		"systemFooter":  ClientConfig.SystemFooter,

		"systemICP":             ClientConfig.SystemICP,
		"systemOrganization":    ClientConfig.SystemOrganization,
		"systemOrganizationURL": ClientConfig.SystemOrganizationURL,

		"themeColor":       ClientConfig.ThemeColor,
		"darkModeDefault":  ClientConfig.DarkModeDefault,
		"allowUserTheme":   ClientConfig.AllowUserTheme,
		"defaultLanguage":  ClientConfig.DefaultLanguage,
		"turnstileEnabled": ClientConfig.TurnstileEnabled,
		"turnstileSiteKey": ClientConfig.TurnstileSiteKey,

		// 品牌资源
		"FancyBackGroundIconWhite": ClientConfig.FancyBackGroundIconWhite,
		"FancyBackGroundIconBlack": ClientConfig.FancyBackGroundIconBlack,
		"DefaultBGImage":           ClientConfig.DefaultBGImage,
		"SVGIcon":                  ClientConfig.SVGIcon,
		"SVGAltData":               ClientConfig.SVGAltData,
		"TrophysGold":              ClientConfig.TrophysGold,
		"TrophysSilver":            ClientConfig.TrophysSilver,
		"TrophysBronze":            ClientConfig.TrophysBronze,
		"SchoolLogo":               ClientConfig.SchoolLogo,
		"SchoolSmallIcon":          ClientConfig.SchoolSmallIcon,
		"SchoolUnionAuthText":      ClientConfig.SchoolUnionAuthText,
		"BGAnimation":              ClientConfig.BGAnimation,

		"updateVersion": ClientConfig.UpdatedTime,
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"data": clientConfig,
	})
}
