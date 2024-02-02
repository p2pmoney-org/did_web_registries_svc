CREATE TABLE IF NOT EXISTS `webapp_registries_identifier_paths` (
  `PathId` int(11) NOT NULL AUTO_INCREMENT,
  `PathUUID` varchar(36) NOT NULL,
  `PathStatus` int(11) NOT NULL,
  `IdentifierId` int(11) NOT NULL,
  `Path` varchar(256) NOT NULL,
  `Rights` int(11) DEFAULT 0,

  PRIMARY KEY (`PathId`),
  UNIQUE KEY `PathUUID` (`PathUUID`),
  UNIQUE KEY `Path` (`Path`)
);