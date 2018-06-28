/** \file adc.c
  *
  * \brief Samples the AVR's analog-to-digital convertor.
  *
  * Contains functions which sample from one of the AVR's analog-to-digital
  * convertor inputs. Hopefully that input (see initAdc() for which input
  * is selected) is connected to a hardware noise source.
  *
  * A good choice for a hardware noise source is amplified zener/avalanche
  * noise from the reverse biased B-E junction of a NPN transistor. But such
  * a source requires a > 8 volt source, which is higher than the AVR's supply
  * voltage. To help solve this issue, two complementary square waves are
  * outputted from pins PB0 and PB1 (digital out pins 8 and 9 on Arduino).
  * Those pins can be connected to a charge pump circuit to generate the
  * required voltage.
  *
  * This file is licensed as described by the file LICENCE.
  */

#include <avr/io.h>
#include <avr/interrupt.h>

#include "common.h"
#include "hwinterface.h"
#include "hwinit.h"

#define _BV(bit)  (1 << (bit))

/** Enable ADC with prescaler 128 (ADC clock 125 kHz), pointing at input ADC0.
  * On Arduino, that's analog in, pin 0. This also sets up the charge pump
  * cycler.
  */
void initAdc(void)
{
	ADMUX = _BV(REFS0);
	ADCSRA = _BV(ADEN) |  _BV(ADPS2) |  _BV(ADPS1) |  _BV(ADPS0);
		/*
	//ADCSRB = 0;
	//PRR = (uint8_t)(PRR & ~_BV(PRADC));
	DDRB |= 3; // set PB0 and PB1 to output
	PORTB = (uint8_t)(PORTB & ~(_BV(PB0) | _BV(PB1)));
	PORTB |= _BV(PB0);
	// Set timer 2 to interrupt periodically so that the square waves for the
	// charge pump can be cycled. It's possible to do this without interrupts
	// (using PWM), but then two timers will be occupied instead of just one.

	cli();
	//TCCR2A = _BV(WGM21); // CTC mode
	//TCCR2B = _BV(CS21) | _BV(CS20); // prescaler 32
	TCCR1A = _BV(WGM21); // CTC mode
	TCCR1B = _BV(CS21) | _BV(CS20); // prescaler 32
	TCNT2 = 0;
	//TCNT1 = 0;???
	//OCR2A = 9; // frequency = (16000000 / 32) / (9 + 1) = 50 kHz
	//TIMSK2A = _BV(OCIE2A); // enable interrupt on compare match A
	OCR1A = 9; // frequency = (16000000 / 32) / (9 + 1) = 50 kHz
	ETIMSK = _BV(OCIE3A); // enable interrupt on compare match A
	sei();
	*/
}

/** Toggle output pins which connect to charge pump. */
/*
ISR(TIMER1_COMPA_vect)
{
	uint8_t state;
	state = PORTB;
	PORTB = (uint8_t)(PORTB & ~(_BV(PB0) | _BV(PB1))); // break before make
	PORTB = (uint8_t)(state ^ (_BV(PB0) | _BV(PB1)));
}
*/
/** Get one 10 bit sample from the ADC. */
static uint16_t adcSample(void)
{
	uint8_t sample_lo;
	uint8_t sample_hi;

	ADCSRA |= _BV(ADSC);
	while (ADCSRA & _BV(ADSC))
	{
		// do nothing
		/*tx1Char('A');
		tx1Char('D');
		tx1Char('C');*/
	}
	sample_lo = ADCL;
	sample_hi = ADCH;

	return ((uint16_t)sample_hi << 8) | sample_lo; 
}

/** Fill buffer with 32 random bytes from a hardware random number generator.
  * \param buffer The buffer to fill. This should have enough space for 32
  *               bytes.
  * \return An estimate of the total number of bits (not bytes) of entropy in
  *         the buffer.
  */
int hardwareRandom32Bytes(uint8_t *buffer)
{
	uint8_t i;
	uint16_t sample;
	uint16_t entropy;

	// Just assume each sample has 4 bits of entropy.
	// A better method would be to estimate it after running some statistical
	// tests (for example, estimating bias and bandwidth).
	entropy = 128;
	for (i = 0; i < 32; i++)
	{
		sample = adcSample();
		//tx1Char('R');
		tx1Char(sample);
		
		// Each sample is 10 bits. XOR the most-significant (MS) 2 bits into
		// the least-significant (LS) 2 bits. As long as they are not
		// significantly correlated, this shouldn't result in a decrease in
		// total entropy. Since the MS 2 bits and LS 2 bits are a factor of
		// 256 apart (in significance), this correlation should be minimal.
		buffer[i] = (uint8_t)((uint8_t)sample ^ (uint8_t)(sample >> 8));
	}
	return entropy;
}
