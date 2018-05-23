/** \file eeprom.c
  *
  * \brief Reads and writes to the AVR's EEPROM.
  *
  * This contains functions which implement non-volatile storage using the
  * AVR's EEPROM. Compared to contemporary mass storage devices, the size of
  * the storage space is not much (only 1024 bytes on the ATmega328), but it's
  * enough to fit a couple of wallets.
  *
  * This file is licensed as described by the file LICENCE.
  */

#include <avr/eeprom.h>

#include "common.h"
#include "hwinterface.h" 

/** Size of EEPROM, in number of bytes. */
#define EEPROM_SIZE		1024

/** Write to non-volatile storage.
  * \param data A pointer to the data to be written.
  * \param address Byte offset specifying where in non-volatile storage to
  *                start writing to.
  * \param length The number of bytes to write.
  * \return See #NonVolatileReturnEnum for return values.
  * \warning Writes may be buffered; use nonVolatileFlush() to be sure that
  *          data is actually written to non-volatile storage.
  */
//NonVolatileReturn nonVolatileWrite(uint8_t *data, uint32_t address, uint32_t length)
NonVolatileReturn nonVolatileWrite(uint8_t *data, NVPartitions partition, uint32_t address, uint32_t length)
{
	if ((address > EEPROM_SIZE) || (length > EEPROM_SIZE)
		|| ((address + length) > EEPROM_SIZE))
	{
		return NV_INVALID_ADDRESS;
	}
	eeprom_busy_wait();
	// The (void *)(int) is there because pointers on AVR are 16 bit, so
	// just doing (void *) would result in a "cast to pointer from integer
	// of different size" warning.
	eeprom_write_block(data, (void *)(int)address, (size_t)length);
	return NV_NO_ERROR;
}

/** Read from non-volatile storage.
  * \param data A pointer to the buffer which will receive the data.
  * \param address Byte offset specifying where in non-volatile storage to
  *                start reading from.
  * \param length The number of bytes to read.
  * \return See #NonVolatileReturnEnum for return values.
  */
NonVolatileReturn nonVolatileRead(uint8_t *data, NVPartitions partition, uint32_t address, uint32_t length)
{
	if ((address > EEPROM_SIZE) || (length > EEPROM_SIZE)
		|| ((address + (uint32_t)length) > EEPROM_SIZE))
	{
		return NV_INVALID_ADDRESS;
	}
	eeprom_busy_wait();
	// The (void *)(int) is there because pointers on AVR are 16 bit, so
	// just doing (void *) would result in a "cast to pointer from integer
	// of different size" warning.
	eeprom_read_block(data, (void *)(int)address, (size_t)length);
	return NV_NO_ERROR;
}

/** Ensure that all buffered writes are committed to non-volatile storage.
  * \return See #NonVolatileReturnEnum for return values.
  */
NonVolatileReturn nonVolatileFlush(void)
{
	// Nothing to do; writes are never buffered.
	return NV_NO_ERROR;
}


//-------  my addition which is brought from wallect.c  ------ 

/** Size of global partition, in bytes. */
#define TEST_GLOBAL_PARTITION_SIZE		512
/** Size of accounts partition, in bytes. */
#define TEST_ACCOUNTS_PARTITION_SIZE	1024
/** Size of accounts partition. This can be modified to test the behaviour of
  * getNumberOfWallets(). */
static uint32_t accounts_partition_size = TEST_ACCOUNTS_PARTITION_SIZE;

/** Get size of a partition.
  * \param out_size On success, the size of the partition (in number of bytes)
  *                 will be written here.
  * \param partition Partition to query. Must be one of #NVPartitions.
  * \return See #NonVolatileReturnEnum for return values.
  */
extern NonVolatileReturn nonVolatileGetSize(uint32_t *out_size, NVPartitions partition)
{
	if (partition == PARTITION_GLOBAL)
	{
		*out_size = TEST_GLOBAL_PARTITION_SIZE;
		return NV_NO_ERROR;
	}
	else if (partition == PARTITION_ACCOUNTS)
	{
		*out_size = accounts_partition_size;
		return NV_NO_ERROR;
	}
	else
	{
		return NV_INVALID_ADDRESS;
	}
}